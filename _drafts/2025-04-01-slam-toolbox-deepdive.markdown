---
layout: post
title:  "SLAM Toolbox Parameters"
date:   2025-04-01 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">





This [popular SLAM Paper][2] says that *"SLAM systems require extensive parameter tuning in order to work correctly for a given scenario."* I struggled through this when setting up SLAM Toolbox with Gazebo. Using the default parameters, the algorithm failed to find loop closures in my simulated environment. SLAM Toolbox has [well-documented descriptions][20] of each parameter, but given the large number of parameters, I had trouble deciding which parameters to tune first, and understanding how each parameter affected the end result.

I spent some time learning the algorithms used in SLAM Toolbox and the purpose of each parameter. Afterwards, I was able to create a cleaner map by tuning the default parameters to my use-case, as shown below.

![Long Exposure Laser Square Drawn by Robot](/assets/images/slam_parameters/beforeafter.png)

<hr style = "margin-top: 4rem">
<br /><br />





### SLAM Toolbox uses Graph SLAM

[PPF of SLAM Paper][2]

- 1986 to 2004 : EKF-SLAM, FastSLAM (Rao-Blackwellised Particle Filters), Maximum Likelihood Estimation
- 2004 to 2015 : GRAPH-SLAM (MAP - Maximum a posteriori estimation via factor graphs)
    - observability, convergence, consistency, sparsity
- Kalman SLAM, Particle SLAM, Graph SLAM
- Ceres Optimizer (I believe the optimization happens only after a loop closure is found via scan matching)
- Everything below refers to GRAPH SLAM.

<hr style = "margin-top: 4rem">
<br /><br />





### SLAM Toolbox's SLAM is Dense

[PPF of SLAM Paper][2]

- Front End (graph construction - sensor data, relate observations, apply edges/constraints to graphs)
- Back End (graph optimization - takes graph, optimizes the graph by configuring nodes to reduce the error "introduced by the constraints"??)
- Types
    - Feature, Dense, Geometry SLAM
- Feature
    - SIFT, ORB, SURF

<hr style = "margin-top: 4rem">
<br /><br />





### SLAM Toolbox Parameters Explained


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title_small">odom_frame, map_frame, base_frame</div>
<hr class="small">

The SLAM node is subscribed to the `/tf` topic, where it listens for transforms from odom_frame -> base_frame provided by a seperate odometry node. For me, I'm using the ekf_node provided by the robot_localization package, which takes in IMU and wheel encoder measurements to estimate the robot's position.

**Frame Ordering:** slam_toolbox orders its frames to follow [REP105][12]. Because tf2 requires that transforms be connected in a tree, the base_frame cannot have two parents (map and odom). This also intuitively makes sense; if we want to use forward kinematics to calculate the pose of a frame with respect to one of its ancestors, but there are two paths between the two frames, we might have two disagreeing transforms. Instead, a map_frame -> odom_frame transform is created, which can be described as the correction for the drift of the odometry over time. Because the odometry transformations are often published at a much higher rate than the map updates, a second benefit of ordering the frames from map_frame -> odom_frame -> base_frame is that our map_frame -> base_frame now has the benefits of the fast and continuous odometry updates, and the slower non-continuous error-correction benefits provided by the map.

**Calculating map_frame -> odom_frame:** Test

<div markdown="1" class="sub-block x-urgent med-top-m">

#### Questions

<!-- - what is the origin of the map frame? the starting point? the dock? -->
<!-- - is the odometry information provided by odom_frame->base_frame from the /tf topic used for any else? How is odometry information added to the pose graph? -->
<!-- - if the *use_scan_matching* parameter is turned on, then I believe visual odometry is also calculated by slam_toolbox. Is this also published to /tf (so a second node is now publishing odom_frame -> base_frame), or just used internally for the pose graph, and part of map -> base_frame? -->
- why does the ekf_node need access to the map_frame? this feels like a circular dependency? The [tutorial][13] seems to say its ok to have one ekf_node that just performs continuous odometry and publishes odom_frame -> base_frame, and there can be a second ekf_node that accounts for noncontinuous, jumping, global data provided by a map_transform.

</div>
</div>


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title_small">scan_topic</div>
<hr class="small">

This topic is how slam_toolbox recieves the [LaserScan][14] messages. These messages have a timestamp.

<div markdown="1" class="sub-block x-urgent med-top-m">

#### Questions
<!-- - how is a scan paired with a pose to create a PosedScan? -->
- what if we want to add other sensor data?

</div>
</div>


<!-- <div markdown="1" class="sub-block neutral med-top-m">
<div class="title_small">localization_on_configure </div>
<hr class="small">

[PPF of SLAM Paper][2]

- slam-toolbox Mapping Mode vs Localization Mode
- KD Tree Search
- AMCL localization

</div> -->


<div markdown="1" class="sub-block neutral med-top-m large-bot-m">
<div class="title_small">minimum_time_interval, minimum_travel_distance, minimum_travel_heading</div>
<hr class="small">

These parameters affect when a laser scan is processed and added to the pose graph.

If the time between two scans (retrieved from the timestamp in the messages' headers) is less than the `minimum_time_interval`, `SlamToolbox::shouldProcessScan` returns false and the scan is either not added to the pose graph (asyncronous mode), or not added to the queue to add at to the pose graph (synchronous mode). 

The second two parameters are both used in `Mapper::HasMovedEnough`. This measures position changes between the current candidate pose and the last pose added to the pose graph. These checks are made in the `Mapper::Process` method, called from `SlamToolbox::addScan`. If the pose of the robot in the current scan has not moved enough, then the scan will not be added to the pose graph. These checks are *not* done on the first scan and when starting a new session with an old map.

<div markdown="1" class="sub-block x-urgent med-top-m">

#### Tuning

In summary, these parameters limit the number of scans that make it into the pose graph. It is important that nodes in a pose graph are not too close or too far apart, because...

- Insufficient nodes: less chances for loop closure, less matching points in adjacent scans making scan matching harder? increase number of nodes when no loop closures found?
- Excessive nodes: more complex optimization? reduce number of nodes when laggy? optimizer fails?

#### Questions

- why square `m_pMinimumTravelDistance` AND the true distance during the comparison, could just compare absolute values?
- The documentation mentions that `minimum_time_interval` is for syncronous mode only, but it seems to be used in asynchronous mode [too](https://github.com/SteveMacenski/slam_toolbox/blob/191cdb52d7816a6f2e1f4986d7e5085deb55690e/src/slam_toolbox_async.cpp#L57).

</div>

<!-- `minimum_travel_distance` -> `m_pMinimumTravelDistance`
`minimum_travel_heading` ->`m_pMinimumTravelHeading` -->

</div>





### Interlude: Explaining MCSM Scan Matching

One of the most important part of SLAM algorithms is scan matching: the processes of aligning two pointclouds to determine the transformation (translation and rotation) between them. SLAM Toolbox uses two scan matchers, `m_pSequentialScanMatcher` and `m_pLoopScanMatcher`. The sequential matcher finds transformations between scans taken sequentially, which is used to define edge constraints between nodes in the pose graph and for visual odometry. The loop matcher searches more broadly for similar scans to close loops when the robot revisits places. These closures create edge constriants in the pose graph connecting more distant nodes.

![Pose Graph Showing Edges from Both Scan Matchers](/assets/images/slam_parameters/loop_closure.png)

<hr class="medium">

#### ICP

ICP is a common point cloud registration technique used in robots. One common ICP use-case is to estimate the pose of a known object in an environment (by matching a model of the object to a lidar or stereo pointcloud of the environment). However, ICP is susceptible to poor initial guesses. In the case of SLAM, if the initial guess provided by wheel odometry and IMU data is inaccurate, it is likely for ICP to get stuck in a local minimum. This is because the cost-landscape of aligning two pointclouds is very non-convex.

<hr class="medium">

#### CSM (Motion model + Observation model)

CSM (correlation scan matching) and MCSM (muti-resolution auxillary history pointcloud CSM) are more robust point cloud registration techniques used by SLAM Toolbox. Rather than optimizing to reduce the distance between the two pointclouds (ICP), CSM performs a brute-force search over the possible transformations of the scan. This search computes the **observation model**.

In addition to the observation model, CSM takes into account the robot's deviation from the initial-guess transformation, where larger deviations are scored worse. For example, if the motor/IMU odometry predicts that the transformation between two scans is an x-offset of 10cm, y-offset of 11cm, and yaw of 4 degrees, transformations near this transformation are scored higher. These odometry measurements inform the **motion model**.

To paraphrase, CSM has two parts, an **observation model** and a **motion model**. It leverages Bayes' rule to find a probability distribution of the robot's current position.

$$
p(x_i \vert x_{i-1},u,m,z) \propto p(z \vert x_i,m) * p(x_i \vert x_{i-1},u)
$$

This says that the probability of the robot being at position $$x_i$$ (given last position $$x_{i-1}$$, motor commands $$u$$, map $$m$$, and scans $$z$$) is proportional to the **observation model * motion model**. 

- **Observation model:** 
    - the probability of observing $$z$$ at $$x_i$$ in the map $$m$$
    - found via scan-matching, better matches have higher probability
- **Motion model:**
    - the probability of the robot being at position $$x_i$$ given last position $$x_{i-1}$$ and encoder/IMU sensor readings $$u$$ (dead reckoning)
    - Note: $$u$$ is the standard convention representing control inputs. However, I believe it's used here to represent IMU and wheel encoder sensor data.

Our guess of the current position will be the mean of $$p(x_i \vert x_{i-1},u,m,z)$$. However, having the distribution is useful because the standard deviation gives us a confidence interval. Confidence can be encoded into each edge constraint in the pose graph by specifying how "rigid" an edge is during optimization. For example, if the robot is travelling down a hallway that is long in the X direction, it will have more pointcloud points on the nearby walls above and below it in the Y direction. Consequently, it will have high confidence in it's Y position, and low confidence in it's X position, as reflected in the covariance.

<hr class="medium">

#### CSM Brute Search Steps

The process of finding the best translation between a scan and a map is...

1. **User-Specified Inputs**

    - **Ranges**: bounds for x, y, and yaw for maximum translations and rotations

    - **Resolutions**: step sizes in coarse and fine increments for translations and rotations

2. **Lookup Table**

    - Create a lookup-table using the map, that returns the probability of observing a point existing at some position in the world (high probabilties when near a point in the map)

    - Blur lookup-table to reduce the effects of noisy data
    
    - Construct a lower-resolution lookup-table via max-pooling. This ensures that the low-resolution map will not miss the best possible high-resolution score

4. **Coarse Search**

    - Use a quadruple for-loop to score all possible translations in the given ranges using the coarse step size

    - The first three for-loops iterate over all possible x, y, yaw transformations

    - The fourth for-loop iterates over each point in the current scan to score via the observation and motion models

5. **Fine Search**

    - Using the best transformation from the coarse-search, re-search that coarse pixel using the fine step size

6. **Return the best transformation**

This method of using a coarse loop to find the general vicinity of the best transformation, and refining it with a fine loop, is the difference between CSM and MCSM.

<hr class="medium">

#### CSM Other Notes

1. In the simplest case, the **map** $$m$$* used for scan matching is just the previous scan. However, multiple previous scans can be combined to increase the pointcloud density, which (1) shows increases accuracy. The number of previous scans used to construct this map can be limited by both a maximum number of scans, or a maximum distance between the current scan and historical scans.

2. To increase the performance of MCSM, (1) recommends keeping the most computationally expensive operation, yaw rotation, in the outermost loop (rotations require trigonometric and multiplicative operations; translation is only additive).

3. SLAM Toolbox does the outermost loop in parallel: `tbb::parallel_for_each(m_yPoses, (*this));`

4. Some papers mention using **RANSAC** to sample from the map to reduce the effects of outliers, which may be worth experimenting with in noisy environments. Although I imagine it slows down the scan matching, because it requires another for-loop to test multiple random samples of the map.

5. I wonder if a **hybrid approach** could perform better, where a CSM coarse search is used to find a strong initial guess for the ICP algorithm. This might provide more accurate results because the best-possible transformation isn't limited to the accuracy of the fine resolution step size.

6. Experiments from (2) use a coarse step size of 30cm, and fine step size of 3cm. This 10x difference is contrasted by SLAM Toolbox, which only uses a 2x multiplier
    - Rotation is coarse to fine: `0.5 * m_pMapper->m_pCoarseAngleResolution->GetValue()`
    - Translation is fine to coarse: `2 * m_pCorrelationGrid->GetResolution()`

<div markdown="1" class="sub-block x-urgent med-top-m med-bot-m">

In regards to bullet 2, SLAM Toolbox actually has rotation on the innermost loop (see `ScanMatcher::operator()`). I believe this is OK because I think SLAM Toolbox uses a larger lookup table with all rotations pre-computed, although I am not sure of this (should study `m_pCorrelationGrid` and `m_pGridLookup` for a better answer to this).

</div>

<hr class="medium">





<!-- _________ BACK TO 'SLAM Toolbox Parameters Explained' _________ -->

<!-- <div markdown="1" class="sub-block neutral large-top-m">
<div class="title_small">position_covariance_scale, yaw_covariance_scale</div>
<hr class="small">

Variable Names: `position_covariance_scale_` and `yaw_covariance_scale_`
Methods: *SlamToolbox::addScan* -> *SlamToolbox::publishPose*

These scale the covariance of the map_frame->base_frame poses published with the PoseWithCovarianceStamped messages on the /pose topic.

Covariance measures the...

</div> -->


<div markdown="1" class="sub-block neutral large-top-m">
<div class="title">Scan Match Multi-Scan Map</div>
<div class="title_xsmall">scan_buffer_size, scan_buffer_maximum_scan_distance</div>
<hr class="small">

These are both used in `ScanManager::AddRunningScan` to limit the number of scans stored in the `std:vector` variable `m_RunningScans`. If there are more than `scan_buffer_size` scans, or the euclidean distance between the first and last scan is greater than `scan_buffer_maximum_scan_distance`, the oldest scan is removed.

When a new scan is added and `Mapper::Process` is called, the `m_pSequentialScanMatcher` compares the current scan to `m_RunningScans` (the scans that form the map $$m$$), to find the best pose. Once the best sequential transform has been found and the new node and edges have been added to the pose graph, the current pose is then added to `m_RunningScans` with `ScanManager::AddRunningScan`.

Additionally, I *think* that edges (constraints) in the pose graph are created between the current node, and all nodes from the map $$m$$ that were used for scan matching. `LinkChainToScan(pSensorManager->GetRunningScans(rSensorName), pScan, scanPose, rCovariance);`

Scan matching can also be completely turned of with `use_scan_matching`. Without this, I cannot get any pose graph to appear on the `slam_toolbox/graph_visualization` topic, which makes me think a pose graph is not created (even with edges *just* based on sensor odometry).

<!-- #### Variable Mappings
`scan_buffer_size` -> Mapper -> `m_pScanBufferSize` -> ScanManager -> `m_RunningBufferMaximumSize`
`scan_buffer_maximum_scan_distance` -> Mapper -> `m_pScanBufferMaximumScanDistance` -> ScanManager -> `m_RunningBufferMaximumDistance`
`use_scan_matching` -> `m_pUseScanMatching`
-->

</div>


<div markdown="1" class="sub-block neutral large-top-m">
<div class="title">Scan Match Lookup Table</div>
<div class="title_xsmall">correlation_search_space_dimension, correlation_search_space_resolution, correlation_search_space_smear_deviation</div>
<div class="title_xsmall">loop_search_space_dimension, loop_search_space_resolution, loop_search_space_smear_deviation</div>
<hr class="small">

In scan matching, the ROS2 LaserScan messages themselves do not form the map and scan. Instead, the messages are transformed into grids, which are cropped and blurred versions of the original messages. This is done in `ScanMatcher::AddScan`, where the scans are iterated over, and the corresponding cells in the `m_pCorrelationGrid` are marked as occupied. I think of the correlation grid as a grayscale image aggregation of historical scans.

When the static method `ScanMatcher::Create` is called, one of the member variables is `pCorrelationGrid`. So `correlation_search_space_dimension` defines the map size (how much cropping is done), and `correlation_search_space_smear_deviation` describes how much map blurring is done for the `m_pSequentialScanMatcher`. The other two parameters do the same for the `m_pLoopScanMatcher`. The number of cells in the grid is not actually `...search_space_dimension` itself, but the `...search_space_dimension` / `...search_space_resolution` (plus some additional padding).

#### Scan Match Translation Search

As I talked about above, MCSM uses a triple for-loop to loop over the given x, y, and yaw ranges in step sizes based on given resolutions. As you will see in the box below, for yaw, these ranges and resolutions can be explicitly defined by the user. However, for x and y, the range and resolution of the search is determined by the size (`search_space_dimension`) and resolution (`...search_space_resolution`) of the correlation grid itself in `ScanMatcher::MatchScan`. The coarse resolution is hardcoded to be twice that of the fine resolution.

<!-- min_pass_through -> m_pMinPassThrough, occupancy_threshold -> m_pOccupancyThreshold -->
<!-- correlation grid creation? (LaserScans to Grid) -->
<!-- these are in Karto.h, which is in Mapper.h, which is in Mapper.cpp -->
<!-- used in the OccupancyGrid class, in UpdateCell -->
<!-- although i don't know where this OccupancyGrid class gets used -->

<div markdown="1" class="sub-block x-urgent med-top-m med-bot-m">

#### Questions

- Why is the correlation grid blurred after each point from a scan is added, and not after all points are added, or even all scans are added?
    - `m_pCorrelationGrid->SmearPoint(gridPoint);`
- What is the difference between `pSearchSpaceProbs` and `pCorrelationGrid`?
- [ScanMatcher::Create](http://docs.ros.org/en/noetic/api/open_karto/html/classkarto_1_1ScanMatcher.html) is a static class method... why not just use a constructor?

</div>

<!-- `correlation_search_space_dimension` -> Mapper -> `m_pCorrelationSearchSpaceDimension`

m_pLoopScanMatcher = ScanMatcher::Create(pMapper,
    m_pMapper->m_pLoopSearchSpaceDimension->GetValue(),
    m_pMapper->m_pLoopSearchSpaceResolution->GetValue(),
    m_pMapper->m_pLoopSearchSpaceSmearDeviation->GetValue(), rangeThreshold);

m_pSequentialScanMatcher = ScanMatcher::Create(this,
    m_pCorrelationSearchSpaceDimension->GetValue(),
    m_pCorrelationSearchSpaceResolution->GetValue(),
    m_pCorrelationSearchSpaceSmearDeviation->GetValue(), rangeThreshold); -->

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Scan Match Angle Search</div>
<div class="title_xsmall">coarse_angle_resolution, coarse_search_angle_offset, fine_search_angle_offset, use_response_expansion</div>
<hr class="small">

These values are used in the yaw for-loop of MCSM to define the range of possible rotations to explore and the step size. The parameters are defined in radians, although I talk in degrees below for simplicity.

1. An offset of 15 degrees would mean poses 15 degrees each way would be scored: a 30 degree range in total.

2. The fine angle step size is hardcoded as 1/2 of `coarse_angle_resolution`. `0.5 * m_pMapper->m_pCoarseAngleResolution->GetValue()`

3. If a sufficient match is not found between the scan and map, and `use_response_expansion` is set to true, the `coarse_angle_resolution` will be increased by 20 degrees, and a search will be run again. If a match is still not found, attempts are also made at 40 and 60 degrees.

4. Unlike the translational offsets and resolutions, the angle offsets and resolutions are shared between both the sequential and loop matching scan matchers.

<div markdown="1" class="sub-block x-urgent med-top-m med-bot-m">

Questions
- what defines a sufficient match? AKA how can the `bestResponse` be 0.0, each translation must have *some* score.
- When running `use_response_expansion` loops, maybe add functitionality to not re-search the inner range?
- Why is a `fine_search_angle_offset` parameter given? Once a coarse maximum score is found, don't we know that best score must be somewhere within the `coarse_angle_resolution` (and this is why `fineSearchOffset(coarseSearchResolution * 0.5)`, aka for translation, the offset is set to the resolution since we know the best score must be within the pixel)?

</div>

<!-- These values feel like they should belong to ScanMatcher (they are often used with the above attributes, search space dimension/resolution/smear) (since they are only used in ScanMatch functions), but [ScanMatcher](http://docs.ros.org/en/noetic/api/open_karto/html/classkarto_1_1ScanMatcher.html) is provided by Karto and the constructor requires a Mapper, `m_pMapper`. So we don't have the flexibility to move them over anyways. -->

<!-- `coarse_search_angle_offset` -> `Mapper` -> `m_pCoarseSearchAngleOffset`
`coarse_angle_resolution` -> `Mapper` -> `m_pCoarseAngleResolution`
`fine_search_angle_offset` -> `Mapper` -> `m_pFineSearchAngleOffset`
`use_response_expansion` -> `Mapper` -> `m_pUseResponseExpansion` -->

</div>


<div markdown="1" class="sub-block neutral large-top-m">
<div class="title">Chains and Loop Closing</div>
<div class="title_xsmall">do_loop_closing, loop_match_minimum_chain_size, loop_match_maximum_variance_coarse, loop_match_minimum_response_coarse, loop_match_minimum_response_fine</div>
<hr class="small">

Loop closing, as shown in the image above, makes SLAM powerful because it corrects error accumulated over time. Without loop closing, SLAM just becomes a fancy dead-reckoning system.

<div markdown="1" class="sub-block x-urgent med-top-m med-bot-m">

Questions/TODO:
- I need to better understand chains

</div>

<!-- loop_match_minimum_chain_size -> Mapper -> m_pLoopMatchMinimumChainSize -->
<!-- loop_search_maximum_distance -> Mapper -> m_pLoopSearchMaximumDistance -->
<!-- loop_match_maximum_variance_coarse -> m_pLoopMatchMaximumVarianceCoarse -->
<!-- loop_match_minimum_response_coarse -> m_pLoopMatchMinimumResponseCoarse -->
<!-- link_match_minimum_response_fine -> Mapper -> m_pLinkMatchMinimumResponseFine
link_scan_maximum_distance -> Mapper -> m_pLinkScanMaximumDistance -->

<!-- Methods -->
<!-- MapperGraph::FindNearChains -->
<!-- MapperGraph::FindPossibleLoopClosure -->
<!-- MapperGraph::TryCloseLoop -->

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Scan Match Motion Model</div>
<div class="title_xsmall">distance_variance_penalty, angle_variance_penalty</div>
<div class="title_xsmall">minimum_distance_penalty, minimum_angle_penalty</div>
<hr class="small">

During the scoring of transformations within the triple for-loop of CSM, the motion model of the scan matcher penalizes transformations that are further from the inital guess made by odometry.

$$
\displaylines {
    \text{penalty} = 1 - \frac{\text{squaredDistance}}{\text{variancePenalty}}
    \\
    \\ \text{clippedPenalty} = \text{max}(\text{penalty}, \text{minimumPenalty})
    \\
    \\ \text{score} = \text{observationModelScore} * \text{clippedPenalty}
}
$$

So this penalty is bounded between the minimum and 1 (as long as the variance penalty is not negative), and it scales the response of the score found via scan matching in `GetResponse`.

This motion model is not used for the loop closure scan matcher (`doPenalize` is set to false).

<!-- `distance_variance_penalty` -> Mapper -> `m_pDistanceVariancePenalty`
`angle_variance_penalty` -> `m_pAngleVariancePenalty`
`minimum_angle_penalty` -> `m_pMinimumAnglePenalty`
`minimum_distance_penalty` -> `m_pMinimumDistancePenalty` -->

</div>






<!-- ### Graph SLAM Theory -->







<!-- ______ MESSY NOTES: Adding a Scan to the Map ______ -->

<!--
*SlamToolbox::addScan*
- We recieve a pose and a scan
- Pass the pose and scan to the Karto Mapper (`Mapper::Process`).
    - This then finds the scanner that made this scan, and retrieves the previous scan via A.
    - If a previous scan is available, continue
    - The scans *corrected* pose is set based on its *odometric* pose and the pose of the previous scan (WHAT?)
    - A check is made that the current scan is far enough away (based on odometry) from the previous scan before continuing with adding it to the pose graph.
    - If the `m_pUseScanMatchin` is true, a best transform between the the current scan and vector of previous scans `m_RunningScans` is found via `ScanMatcher::MatchScan`.
        - The previous scans are stored in `m_RunningScans` (of type `LocalizedRangeScanVector`, an `std:vector`), and scans stored here are limited by `m_RunningBufferMaximumSize` and `m_RunningBufferMaximumDistance` within the `AddRunningScan` function. New scans are added to the back of the vector, and if there are too many scans (more than max size), or the distance between the oldest and newest scan is too large (more than max distance), more scans are removed.
        - The **sequential scan matcher** runs (`ScanMatcher::CorrelateScan`).
            - CorrelateScan seems to be a correlation grid method, not ICP.
            - maybe similar to [this](https://www.mathworks.com/help/nav/ref/matchscansgrid.html)


A. `LocalizedRangeScan * pLastScan = m_pMapperSensorManager->GetLastScan(pScan->GetSensorName());`
B. `if (!HasMovedEnough(pScan, pLastScan))*`
-->


<!-- ______ MESSY NOTES: Factor Graphs and Pose Graphs ______ -->
<!--
[PPF of SLAM Paper][2]
[video][8]

- Graph SLAM is the least-squares approach to SLAM
    - overdetermined system. Equations from measurements and unknowns are robot/feature positions
    - minimize the squared error. Error introduced by the constraints of the pose graph. Functions represent odometry/observations.
    - important to exploit sparsity of the SLAM problem, otherwise very computationally expensive
- Bayes Theorem
- Nonlinear least squares problem - minimizing the error of 
- Gauss-Newton or Levenberg-Marquardt
- Graph-based SLAM has no explicit map. Once all poses of the robot is made, mapping is easy
- Graph node constraints are created by finding correlations between each nodes' associated enviroment data (in our case, these are laser scans stored in PosedScan)
    - these observations are used to create constraints on the poses between nodes, but are not themselves part of the optimization problem
    - the constraints say maybe two node's observations were 2 feet apart, so the nodes should be too
    - what does it mean for the constraints to introduce the error? I thiought costs, not constraints, introduce error. what is the error measurement between, what is the truth (like true label in machine learning) that the measurement is compared to to create the error?
        - maybe the error is just whatever unwanted transformation exists between two nodes that is NOT what the constraint between them defined? so the pose constraint is the "truth" kind of?
        - SEE min 51 of vid 8: the error is the transformation between the measurement transform Z between two nodes and the actual transform in our graph between those nodes.
        - Hx = -b (1:05) (i think this is gauss newton)
        - 1:12 
    - when are two scans compared? consecutive scans for visual odometry?
        - i believe in long term scan matching, since the odometry gives a general location of the robot, historical scans in that area can be considered
    - homogeneous coordinates are used to represent the transformations between nodes. Homogeneous coords allows use to use T and R matrix operations to transform the coordinates
    - Constraints have an information matrix (which I believe determines the uncertainty of measurements?) Scan matching is better than odometry, so its information matrix will have larger values (it matters more during the optimization). It also represents uncertainity in different dimensions. In a long hallway, scan matching is better side to side towards the closer walls
    - the state vector is the number of nodes * number of dimensions
    - the matrix H is sparse becuase the error function between two nodes only needs those two nodes, and also because constraints between nodes usually only happen if those nodes are close together (and scan matching occurs between them)
-->


<!-- ______ MESSY NOTES: Data Association and Loop Closures ______ -->
<!--
[PPF of SLAM Paper][2]
[video][10]

- Short-term: matches between consecutive frames (via optimal flow/descriptor matching)
- Long-term: new measurements to old landmarks for loop closure (via bag-of-words, tree search, other robust methods)
- Loop Closure Algorithms
    - Dense Methods: ICP, Bundle Adjustment, Pose Graph Estimation
    - Scan Matching: ICP, scan to scan, scan to map, map to map, feature based, RANSAC, correlative matching
    - I don't think Long-Term loop closure is referred to as scan matching, scan matching is just for visual odometry to create a better motion model
- Loop Closure Validation
    - When data association fails and returns a bad loop closure, things get bad
    - RANSAC
    - Odometry validation
-->


<!-- ______ MESSY NOTES: SLAM toolbox specific ______ -->
<!--
[video][11]

- The graph stores nodes and confidences (the covariance matrix)
- the pose graph is sensor data agnostic (same with all graph slam, it just cares about the constraints created by the front end)
- slam toolbox is a heavily modified version of open karto (added multithreading to scan matcher, graph/data removal, localization mode, pose graph exposed so user can edit it, serialization, sparse bundle adjustment replaced with series + pluginlib? (min 7), KD-tree)
- synchronous mode is for offline (not trying to navigate, its OK to fall behind, or if navigating with joystick)
- asynchronous mode is best-effort, i believe it takes the most recent scan when it is ready for a new one (instead of using every scan)
- he says his Ceres optimizer parameters should work in most cases and shouldn't need to be changed
- slam toolbox serializes the pose graph and data (NOT the map, correct?) which makes you able to add to it later
- Lifelong mapping = continued mapping + removal of nodes
- he is working (as of 2019) on supporting a single robot with multiple scanners, so you don't need to combine the scans with a scanassembler beforehand

1. Localization
    1. optimization-based localization (Google Ceres)
2. Modes
    1. Async and sync
    2. Lifelong Mapping vs Localization
        1. Lifelong mapping is used to create/update a map, save it, reload it, etc. The map and pose graph is saved (i believe since the pose graph is saved this means loop closure is still possible when its reloaded). While lifelong mapping does update old maps, it does not remove nodes (with outdated information). This is much more computationally expensive.
        2. Localization mode (elastic pose-graph localization) localizes the robot with a known preloaded map. It adds and removes nodes (what does it mean to remove nodes from a preloaded map)? It is similar to AMCL, which requires an initial pose. The underlying map is not updated permanently.
3. Map Merging
    1. Kinematic Map Merging
    2. Elastic Graph Manipulation Merging TBD
4. Terminology
    1. Nodes and connections
5. ROS specifics
    1. Node publishes a map and a map->odom transform
    2. Odometry-based pose + Laser Scan form a PosedScan object. These objects form a pose graph. Odometry is refined with laser-scan matching
6. Loop Closures
    1. found via the pose graph
    2. if a loop closure is found the pose graph is optimized and pose estimates are updated
    3. pose estimates are used for the map -> odom transform
7. Mapping
    1. The pose graph + associated laser scans (for each pose) are used to create the map
    2. So when a loop closure is found, the map is not directly updated. First the pose graph is updated, and therefore the associated scans (via the PosedScan objects) are used to recreate the map
    3. Uses open_karto library, which is good at 2D laser scan matching
-->


<!-- ______ MESSY NOTES: Terminology ______ -->
<!--
-  pose graph
- laser scan matching (to refine odometry)
- KD Tree search (localizes a robots position when given a map)
- pose-graph deformation localization
- AMCL localization
- scan matcher (karto)
-->


<!-- ______ MESSY NOTES: SLAM in General ______ -->
<!--
[Matlab][1]

1. Filtering (EKF/Particle) uses current measurements to estimate state
2. Smoothing uses all historical estimates to estimate trajectories (pose graph optimization is most common for SLAM)
3. Pose Graphs
    1. Each Pose Graph node contains the estimated robot pose, and the lidar scan (PosedScan in slam toolbox)
    2. Each node is measured after some distance or time
    3. the relative poses between PosedScan can be estimated via wheel odometry, IMUs, GPS, visible odometry, etc. Relative because we don't know where we are in the environment, just the relative pose between the two nodes. We also measure how confident we are in our relative pose (so we can add a constraint).
    4. A more confident relative pose gives the edge/connection between the nodes in the pose graph a higher strength, which makes it harder to adjust the relative pose between them. The edges are the constraints? The constraint acts in all 6 DOF
    5. If an external connection is found (aka two scan observations are the same), we can make a new connection between this node and the other node that had this same observation, with an edge length of 0 (we want these poses to be the same). The strength of this edge correlates to how confident we are that the observations match.
        1. what if they are close to the same, slightly different pose?
        2. How are these similar scans found?
        3. whenever relationships between external data / scans can be found, we add new edges to the graph
        4. "its better to miss a real loop closure than create a false one"
    1. maps to do path planning can be created by making a binary occupancy grid (1 for wall 0 for nothing). Probabilistic occupancy grid.
-->


### Papers

1. Liu, Haiqiao, et al. “Correlation scan matching algorithm based on multi‐resolution auxiliary historical point cloud and lidar simultaneous localisation and mapping positioning application.” *IET Image Processing*, vol. 14, no. 14, 14 Oct. 2020, pp. 3596–3601, https://doi.org/10.1049/iet-ipr.2019.1657.
2. Olson, E.B. “Real-Time Correlative Scan Matching.” *2009 IEEE International Conference on Robotics and Automation,* May 2009, https://doi.org/10.1109/robot.2009.5152375.



[1]: https://www.youtube.com/watch?v=saVZtgPyyJQ
[2]: https://arxiv.org/abs/1606.05830

<!-- Older methods -->
[3]: https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1638022
[4]: https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1678144

<!-- Unread (ROS based SLAM) -->
[5]: https://webthesis.biblio.polito.it/29366/1/tesi.pdf
[6]: https://www.researchgate.net/publication/385163294_ROS_2_Robot_With_SLAM/link/6718baf068ac304149abfff9/download?_tp=eyJjb250ZXh0Ijp7ImZpcnN0UGFnZSI6InB1YmxpY2F0aW9uIiwicGFnZSI6InB1YmxpY2F0aW9uIn19
[7]: https://joss.theoj.org/papers/10.21105/joss.02783.pdf

<!-- Video and paper mentioned in video -->
[8]: https://www.youtube.com/watch?v=VRGOLRGwAjg
[9]: https://github.com/ZohebAbai/mobile_sensing_robotics/blob/main/A%20Tutorial%20on%20Graph-Based%20SLAM.pdf

[10]: https://www.youtube.com/watch?v=nvFcN2-NqRc

[11]: https://vimeo.com/378682207

[12]: https://www.ros.org/reps/rep-0105.html
[13]: https://docs.nav2.org/setup_guides/odom/setup_robot_localization.html
[14]: https://docs.ros2.org/foxy/api/sensor_msgs/msg/LaserScan.html

<!-- Karto parameters -->
[15]: http://www.yahboom.net/public/upload/upload-html/1665711621/8.karto%20mapping%20algorithm.html

<!-- Karto paper (seems similar to codebase). Coarse/Fine -->
[16]: https://www.kexuetongbao-csb.com/volume/CSB/69/04/research-of-autonomous-navigation-for-mobile-robots-using-karto-slam-algorithm-under-ros-6663dc3dda4ce.pdf
[17]: https://april.eecs.umich.edu/pdfs/olson2009icra.pdf
[18]: https://ietresearch.onlinelibrary.wiley.com/doi/epdf/10.1049/iet-ipr.2019.1657
[19]: https://citeseerx.ist.psu.edu/document?repid=rep1&type=pdf&doi=ce0f8e87fb01bc09b2e7b75c34f80e4f04ae839a

[20]: https://github.com/SteveMacenski/slam_toolbox?tab=readme-ov-file#configuration
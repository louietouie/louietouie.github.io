---
layout: post
title:  "Estimating Normals from Pointclouds"
date:   2025-01-27 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

I'm working on using Realsense D435 cameras to estimate a 3D scene. To do this, I implemented [Chapter 5][1] of the Robot Manipulation course. This will be useful for using robot arms to find the best grasps available. This is done by looking for two normals that are both A, pointing in opposite directions and B, colinear. This is explained well by equations 2.6-2.8 in the paper [Finding Antipodal Point Grasps on Irregularly Shaped Objects][2].

<img src="/assets/images/pointcloud_normals/real.jpg" alt="2D image of scene" class="image-center-large"/>
<img src="/assets/images/pointcloud_normals/pointcloud.png" alt="Realsense pointcloud of scene" class="image-center-large"/>
<img src="/assets/images/pointcloud_normals/normals.png" alt="Normals created from 2D depthmap" class="image-center-large"/>

[1]: https://manipulation.csail.mit.edu/clutter.html
[2]: https://www.researchgate.net/publication/3298220_Finding_Antipodal_Point_Grasps_on_Irregularly_Shaped_Objects
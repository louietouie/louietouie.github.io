---
layout: post
title:  "Ping Pong Robot - Hardware Upgrades"
date:   2026-02-05 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

Got a job this summer 🥳. Consequently, ping pong robot progress has slowed down, but not stopped...

<br /><br />

### Hardware Upgrades

A lot of hardware upgrades since my last post... beefing up the actuators and adding two new degrees of freedom. The two ODrive's and two NEMA17 stepper motors all communicate over the same CAN network. Commands are sent from ros2_control hardware interfaces on the PC. I made a custom interface to communicate with a CAN shield on the arduino (which controls both steppers). For the elbow and shoulder, ODrive provides [an interface][1] that is well documented/easy to setup.

<img src="/assets/images/hardware_upgrades/arm.jpg" alt="Full arm" class="image-center-large"/>

<br /><br />

### Safety Stops

In late December, I started up the shoulder's ODrive and adjusted configuration settings while the motor was on, which caused it to suddenly spin three full rotations before I could power it off. This ripped out a bunch of wiring harness to the elbow and stepper motors, and resulted in a couple hours of soldering.

To prevent this from happening again, I added a two-layer e-stop. The first layer uses ODrive's endstop functionality; when a pin on the S1 is pulled high, the controller deactivates. However, this layer only works if the configuration has been correctly sent over CAN to the ODrive, specifying the pin number and pin state that define when to stop. The second layer deactivates a latching relay that powers a second relay which powers the S1 with 36V. This is a much more fool-proof switch as it is not dependent on software. Both of these safety systems are *de-energize-to-trip*, something I learned from FSAE. If the safety loop disconnects *anywhere*, it will trigger the safety shutdown.

<img src="/assets/images/hardware_upgrades/estops.jpg" alt="Shoulder E-Stop" class="image-center-large"/>

<br /><br />

### Circuitry

The third relay is a precharge loop to prevent current inrush to ODrive capacitors when turning it back on after hitting the second endstop.

Probably time to move this to a PCB...

<img src="/assets/images/hardware_upgrades/upper_arm_control.jpg" alt="Controls for elbow and wrist" class="image-center"/>

<br /><br />

### Preventing Overshoot: ODrive Trap Trajectory Control

Using ODrive's standard PID position control, the arm overshot goal poses. Commanding distant positions led to agressive movements to the goal pose, even though these same PID values were ideal when commanding nearby positions. My first solution was to clamp the torque, which prevented aggressive movement to far positons, but still overshot. Only after switching to ODrive's trajectory control (where a far position, say 0 -> 1, is gradually commanded dependent on trajectory-specific acceleration and velocity limits). While I do understand how this prevented aggressive movement (since the P error term was no longer too large at any moment), I don't understand why it prevented overshoot, as I didn't change my D term much. Maybe because it prevented the I-term from growing quickly? **Note from future**: It likely prevented overshoot because of trap trajecory's `decel_limit`; the trajectory commanded accounts for deceleration before reaching the goal, something the D-term was solely responsible for beforehand.

Now, when controling the arm with an Xbox controller, it swings fast and tracks commands well with no overshoot.

<br /><br />

### Next Steps: Software

Unlike the hardware, the software is still in need of some large improvements. Other than adding the new ros2_control hardware interfaces and altering the MPC trajectory optimization and hit pose finder to accomidate the wrist, there has not been much improvement to the algorithms themselves. I was hoping for a larger performance gain after replacing the cardboard paddle and adding the new actuators, but I realize now that the weak link was likely always the software. My plans moving forward and problems I need to better understand are...
1. Switch out the ball prediction from RANSAC-only (based on the current queue of relevant ball positions) to something with a Kalman Filter
    - My current model doesn't account for the nonlinearity of bouncing, which I have found much more difficult to remove than the nonlinearity of gravity (very predictable), since it requires detecting the bounce times
    - One idea I have is having a multi-hypothesis model, each which guess a difference bounce time, and scoring which fit best.
2. Reposition cameras to be stacked vertically behind the robot so the trajectory can be recorded longer
3. The robot looks drunk, which I think may improve if I change from position control to torque control. I need to actually quantify this using ros bag recordings, but I believe that the robot is not reaching its goal positons. I am sending it positions at the time I want it there, and it is never able to keep up with the position commands. I think if I instead use torque or velocity control in combination with a PID controller, I can then control it to follow the ideal trajectory. I'm not sure yet if my reasoning here is sound...
4. The MPC controller could be revisited.
5. The robot seems to always start it's forward swing about 0.5 seconds too late. I don't know why yet.


[1]: https://github.com/odriverobotics/ros_odrive
[2]: https://docs.odriverobotics.com/v/latest/manual/control.html#trajectory-control
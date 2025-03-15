---
layout: post
title:  "Finding Joint Trajectories to Hit Ping Pong Balls"
date:   2025-03-14 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

I'm working on creating joint trajectories for the 2-DOF robot arm to hit ping pong balls (with the help of [Chapter 6][1] of the Robot Manipulation course and also heavily inspired by [CatchingBot][2]).

<iframe width="840" height="473" src="https://www.youtube.com/embed/Oaca0qH5ppw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<br /><br />

### Current Optimization

Currently, the constraints on the optimization problem only include... 

1. joint position and velocity limits
2. end effector velocity must start and end at 0 velocity
3. trajectory duration
4. starting position of the arm
5. intercept position of the arm (timed when the ball arrives)

<hr style = "margin-top: 4rem">
<br /><br />

### Next Steps

This simple version won't work in real life because the ball isn't aimed correctly and there is no power in the swing. To fix this, I will need to add...

1. An OrientationConstraint on the paddle that restricts the normal vector of the ping pong paddle to bisect the velocity vector of the ping pong ball and the vector pointing from the center of the paddle to the center of the opposite side of the table.
2. A VelocityConstraint that forces the paddle to move into the ball during the hitting phase of the trajectory. I am thinking of constraining the velocity vector to align with the normal of the ping pong paddle.

Additionally, I'm running into problems since the robot arm only has two DOF. This heavily limits the options the robot has for where it can intercept the ping pong ball (for example, it cannot reach up or down to contact the ball, it has to wait until the ball crosses through the plane it works in). To keep the weight of the robot down, my plan is to add as few joints as possible. I am going to try adding two wrist joints first.

[1]: https://manipulation.csail.mit.edu/trajectories.html
[2]: https://www.youtube.com/watch?v=TrhjG72PJNU
---
layout: post
title:  "Ground Loops"
date:   2024-11-18 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

![Robot Arm and Shoulder Joint](/assets/images/robot_arm.jpeg)

<hr style = "margin-top: 4rem">
<br /><br />

## 🌑︎ : Background

I've recently finished all the 3D prints for a robot arm. A M8325 ODrive actuates the shoulder and a plain NEMA17 stepper actuates the elbow. Eventually, I hope to add a quaternion wrist joint and have the arm intercept/hopefully return ping pong balls (tracked with stereo vision), but wanted to start with a smaller project scope.

The current goal is just to get this robot arm to draw simple shapes using differential inverse kinematics (with the help of Drake). I plan on using ros2_control and Odrive's ROS2 CAN package to make interfaces for the RPi 5 to communicate with the Odrive and Arduino/TMC2209. The RPi will have a RS485 and the arduino will have a MCP2515 for CAN communication.

Planning the wiring has been a bit more difficult than I expected because it has taken me some time to understand how to manage ground loops and electromagnetic interference (EMI). Below are some of the questions I have had, and hopefully their answers.

<hr style = "margin-top: 4rem">
<br /><br />

## 🌒︎ : Questions + Answers

+ What are the different ways that current can flow through ground loops?
 <div markdown="1" class="answer">
- Current will flow through a ground loop if the two grounds in the loop have different voltage levels (like with two different outlets).
- They can also generate new noisy current if AC current passes through them. The resulting magnetic field induces a current in the ground loop.
- Sources: [Ball Systems][4]
</div>


+ I've heard if you can draw a loop in your ground paths, you have a ground loop. How extreme is this? What if I have a hole in a busbar ground, is the path around the hole a ground loop? What if I need a thicker, lower AWG cable for ground, but instead just use two thinner cables that take the same path, is this a ground loop?
 <div markdown="1" class="answer">
- Yes, those are both ground loops. But the severity of a ground loop depends on the area of the loop, difference in ground voltages, and wether other signals are carried on the wire.
- The size of the loop matters (see [why](#area-bookmark)). So because a hole in a busbar is pretty small, this isn't going to generate a large current.
- What else is on the loop matters. Extra noise on a busbar and extra noise on two grounding cables probably isn't a problem, since they aren't sensitive to ground loop current. Ground loop current becomes a problem when it starts flowing through signal wires (like a USB connection), or pins on a board that aren't able to handle the ground loop currents (this is why ODrive recommends if worst comes to worst and you have to have a ground loop, put [resistors between the low current pins][6] to protect them by limiting the ground loop current that can flow).
- The ground loops created by the layers of a PCB (vias connecting to the copper ground layer) have [very small inductance][9] since they are so small.
- Sources: [SE Question][5]
</div>

+ I've heard if you use two seperate outlets, your ground can be at two different potentials. How is this possible if the two outlet grounds both connect to the ground busbar at the breaker box? Additionally, at [2:30][9], Zach says the reason is the voltage difference exists between two outlet grounds is because there is an "stake in ground... imperfect connection... in the earth". But don't these two outlets meet at the ground busbar in the breaker box *before* the lightning rod?
 <div markdown="1" class="answer">
 - All wires have some impedance and resistance. So just because all outlets in a house meet at the same ground busbar, the wires don't "teleport" this ground reference perfectly from the busbar to each outlet.
 - Side note: never break off an outlet ground pin to prevent a ground loop between two devices. If the device has a fault, there is no high-current ground path for the current to take, only through the signal ground (the plug between the two devices), through the other devices power ground. This high current is likely to burn up the signal ground. With no low resistance path to take back to ground, this current may then flow through you.
 - Sources: [Audio Video][7], 
 </div>

+ <span id="area-bookmark"></span> Why does reducing the area of a ground loop reduce the amount of current that it induces?

$$
\displaylines{
   v = \frac{d\lambda}{dt}
   \\ \lambda = N \phi
   \\ \phi = \mathscr{P}Ni
   \\ \mathscr{P} = \frac{\mu A}{\mathcal{l}}
   \\ v = \frac{d\lambda}{dt} = \frac{d(N \phi)}{dt} = \frac{d(N\mathscr{P}Ni)}{dt} = N^2\mathscr{P}\frac{di}{dt}
   \\ v = L\frac{di}{dt}
}
$$

<div markdown="1" class="answer">
- TLDR: Because reducing the area is the same as reducing *L*.

- $$\lambda$$ is flux linkage, measured in weber-turns
- N is the number of turns of the inductor
- $$\phi$$ is the flux, measured in webers
- $$\mathscr{P}$$ is the permeance, and is dependent on the material and cross sectional area of the inductor. A larger cross-sectional area increases $$\mathscr{P}$$, which increases the inductance L, which means for a given change in current, the voltage difference is larger.
- For ground loops, we want to avoid a large voltage difference (because this means more noisy current through our ground loop), so keeping the cross-sectional area small helps with this.
</div>

3. At what current does an ODrive ferrite ring (wrapped around the phase wires) become necessary?
4. What allows ODrive ferrite rings to allow motor current to pass, while also filtering out EMI/RFI? Is it because the motor current is lower frequency than the EMI, or because the motor current is differential mode (the current in all three phase wires adds up to 0), while EMI is common mode?
5. What creates the EMI/RFI in a motor?
8. When should I use the Siglent 3303 green ground terminal?
9. Are the 3 Siglent 3303 power channels isolated from each other?
10. The ODrive ferrite ring seems to be a common-mode choke. What makes is that, and what is the difference between a common-mode and a differential-mode choke?
11. Why does ODrive say to keep the 2 Odrive power cables short and close together (to lower impedance), but add a ferrite ring to the 3 phase cables (to increase impedance)? If the current powering the ODrive via the 2 power cables is DC, why does impedance matter at all? Does PWM/FOC cause the current to constantly change at this input? Ground Loop keep V_1 small

1. Should my ODrive CAN system be isolated, share a common ground, or neither (AKA hope that the differential nature of CAN allows it to function without surpassing the maximum common mode voltage)?
2. What is the downside of keeping the power supply for the ODrive + motor fully separate/isolated from the power supply for everything else, and having the only thing connecting the two systems be CAN HI and CAN LO (and hoping that differential nature of CAN is sufficient to handle the two separate grounds)?
3. What if we only connect the grounds of the two power supplies, so they share the same ground voltage for CAN, and then don't include a CAN ground/shield wire, instead trusting that there will . Can ground current flow through CAN HI and CAN LO to create a ground loop
4. If the ODrive (the source of the V_1 drop that causes the ground loop as described in the documentation) uses a seperate power supply than the RPi5, is a ground loop star point need? If it would still be needed, what if the CAN system was isolated, then would the ground star be needed?
5. What is the point of CAN GND NC pin on the ODrive S1 ([*"GNC NC offers a common connection for the CAN bus ground, it is not connected internally"*][1]), if it is not used ([*"CAN referenced to DC- on ODrive S1. CAN GND not used."*][2])?
   - The documentation also says *"CAN is not isolated, CAN signals are referenced to DC-. Therefore you must connect your CAN bus ground to DC- at the system star point."* So why aren't we connecting CAN GND NC?
   - This [tutorial][3] does use the CAN GND pin
6. The RPi is powered with a CanaKit power block. I've also connected a RPi5 GND pin to the star point point. Is this safe? I imagine the CanaKit power block is isolated from the AC wall outlet?
7. Should I run a ground straight from the MCP2515 to the star point?

1. I understand that inductors resist change in current and can't change from one amperage to another immediately (because this would mean $$\frac{di}{dt} = \infty$$ and therefore the voltage to achieve this would be infinite). But physically, why can't they change immediately? Can magnetic fields not dissipate immediately?
2. Why use PWM to simulate a lower voltage instead of just lower the input voltage? What is constant current reduction?
3. What does this mean? "ODrive is happier with higher inductance... means current controller bandwidth is reduced"
4. What is the difference between the two CAN IOs, pins 1-4, and RS485A/RS485B on the ODrive?
   - The RS485 pins have nothing to do with RS485 CAN hats. They are a [differential interface][1] for RS-485 encoders.

+ Other notes
 <div markdown="1" class="answer">
 - Make sure that signal circuits are referenced to one point as ground ([vid][8])
 </div>

<hr style = "margin-top: 4rem">
<br /><br />

## 🌓︎ : Possible Circuit Layouts

<hr style = "margin-top: 4rem">
<br /><br />

## 🌕︎ : Next Steps

<hr style = "margin-top: 4rem">
<br /><br />

## 🌗︎ : Resources
1. [Control Bootcamp][1]: Very good, a lot of the stuff I learned/explained here is just directly from Steve.
2. [Turn Continuous A into Discrete F][5]

<!-- links -->
[1]: hhttps://docs.odriverobotics.com/v/latest/hardware/s1-datasheet.html
[2]: https://docs.odriverobotics.com/v/latest/guides/can-guide.html
[3]: https://docs.odriverobotics.com/v/latest/guides/arduino-can-guide.html
[4]: https://www.ballsystems.com/blog/sizing-ground-loops
[5]: https://electronics.stackexchange.com/questions/610559/can-a-ground-loop-occur-if-everything-is-sharing-a-single-socket
[6]: https://docs.odriverobotics.com/v/latest/articles/ground-loops.html
[7]: https://www.youtube.com/watch?v=i98HD4fXwZI
[8]: https://www.youtube.com/watch?v=PACur_GcTJ0
[9]: https://youtu.be/3swYweisn5g?si=CB1eMmazpp2G0Rzr&t=154

<script src="//d3js.org/d3.v7.min.js"></script>
<script src="{% link assets/js/linearization.js %}" type="text/javascript"></script>


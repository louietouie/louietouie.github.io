---
layout: post
title:  "Motor Basics"
date:   2025-01-05 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

<!-- ![Long Exposure Laser Square Drawn by Robot](/assets/images/laser_square.jpeg) -->




I keep encountering electric motors. Every time I work with one, I realize that I don't really understand how they work. For example...

1. In the RC world, I've used brushed motors and brushless motors in Traxxis cars and in a Super Cub plane. *Why do the brushed motors only have 2 wires, but the brushless motors have 3?*
2. In Formula Hybrid, our car had a Bamocar D3 motor controller and an Emrax 228 motor. The accumulator had a discharge loop to discharge the capacitors within the Bamocar D3 when the two large safety relays were opened, but I never had a good sense of why there were capacitors in the first place. *Why can't the lithium-ion batteries just power the Bamocar directly? And why is the Bamocar D3 called a three-phase servo amplifier and not an inverter?*
3. Lastly, an ODrive has made appearances in the last two blog posts. Because of the parasitic resistance and impedance of the DC+/- wires, ground loops are something that need to be considered when using an ODrive. These parastic effects can cause the voltage potential at the DC- port on the ODrive not to be 0V. This means some current may take other paths to ground, like through a USB cable to an arduino, and back through the arduino's ground. *But if my motor is spinning at a pretty constant speed, why is the current through the DC+/- wires changing enough to make parasitic impedance a problem in the first place? And seperately, why does the ODrive need a brake resistor?*

My goal with this post is to learn enough about motors, motor controls (PWM, FOC, current control), and external motor hardware (like capacitors and brake resistors) that I can respond to the three confusions above, which I hope to do at the end of this post.

<!-- One note is this post is heavily influenced by James Mevey's paper on FOC. Probably 70% of this post is me just trying to simplify and summarize what I learned from that paper, which was super helpful (and thanks Solomon from ODrive for recommending it). -->

<hr style = "margin-top: 4rem">
<br /><br />





## Magnetism + Electricity Physics

Before diving into motors, there are a few concept that link the worlds of electricity and magnetism that are crucial to understanding motors.


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Faraday and Lenz</div>
<hr class="small">

**Farday's Law** and **Lenz's Law** both explain the effects of exposing a circuit to a magnetic field.

Flux, $$\phi$$, is the magnetic field over a surface. Usually, this surface is the enclosed surface created by a loop of wire. $$\phi = BA$$, so the flux can change when either the magnetic field strength changes, or when the enclosed area of the wire changes. This change in flux induces a voltage in the wire loop.

$$\epsilon = - \frac{d\phi}{dt}$$

<!-- is this a correct statement? -->
$$\epsilon$$ is the electromotive force (EMF) that results in a voltage difference over the wire. This induced voltage therefore causes a current to flow in the wire.

</div>


<div markdown="1" class="sub-block neutral large-top-m">
<div class="title">Ampere</div>
<hr class="small">

Not only does a changing magnetic field cause current to flow in a wire, but current in a wire causes a magnetic field. **Ampere's Law** describes the relationship between current flow and a generated magnetic field.

$$\oint B dl = \mu_0 I$$

where the integral is over a closed loop of wire, and $$\mu_0$$ is the permeability of free space (a vacuum).

The **Right Hand Curl Rule** can be used to determine the direction of the magnetic field given the direction of current.
1. If the current is traveling down a straight wire, orient your right thumb in the direction of current. Curling your fingers towards your thumb is the direction the magnetic field will flow around the wire.
2. If the current is traveling around a loop or around the turns of a coil, curl your fingers in the direction of the current. Your thumb will point in the direction of the magnetic field created through the center of the loop.

</div>


<div markdown="1" class="sub-block neutral large-top-m">
<div class="title">Lorentz</div>
<hr class="small">

The **Lorentz force** describes the forces that act on a charged particle in the presence of a magnetic and electrical field.

$$\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})$$

where $$q$$ is the particle charge, $$\vec{v}$$ is the particle velocity, $$\vec{E}$$ is the electric field and $$\vec{B}$$ is the magnetic field. In motors, electric fields do not contribute to the torque of the motor, so this equation can be reduced to...

$$\vec{F} = q * \vec{v} \times \vec{B}$$

One important note here is that a force is exerted on this charged particle only when it is *moving across* the magnetic field. The force is highest when the velocity is perpendicular to the magnetic field and cuts through it, and zero when it moves with the magnetic field.

The **Right Hand Rule** can be used to find the direction of the Lorentz force if the charge velocity, $$\vec{v}$$ and magnetic field, $$\vec{B}$$, are perpendicular. First, make an "L" shape with your thumb and pointer finger, and an "L" shape with your pointer finger and middle finger. If your pointer finger points in the direction of the charge velocity (current), and your middle finger in the direction of the magnetic field, your thumb will point in the direction of the resulting force.

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">BLv and BLi Laws</div>
<hr class="small">

<div markdown="1" class="svg-container">
![The BLv and BLi Laws](/assets/images/blv_bli_law.svg)
</div>

</div>

<!-- - CONTENT
    - Magnetic Flux
        - Magnetic flux is the magnetic field through a surface.
        - A changing magnetic flux through a wire loop will cause an EMF, aka an electromotive force (slightly different than voltage), which induces a current in the loop.
        - In radial flux motors (as opposed to axial flux motors), the flux is oriented perpendicular to the motor's shaft. Radial motors are more common and older than the more compact axial motors. However, axial motors have more mass at farther radius, so they have more inertia, and lower RPMs.
        - flux linkage of winding current vs stator
        - Airgaps
        - Rotor flux leakage/permeance
        - Flux path, air gaps, permeability, reluctance, field direction

- QUESTIONS
    - Why does a charged particle need to be moving for a magnetic field to exert a force on it (via Lorentz)? -->

<hr style = "margin-top: 4rem">
<br /><br />





## Motor Types

Motors come in many varieties, and they often can be categorized as either...


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Synchronous or Asynchronous</div>
<hr class="small">

<!-- actually might be one to one, and every K spins for the AC cycle. -->
In synchronous motors, the rotor and stator's spinning magnetic field both spin once for every integer K cycles of the electronically commutated AC current.

An asyncronous motor has no simple integer relationship between the rotor and stator spin rates. Instead, the rotor spins slower than the stator's field.

Because the rotor of an asyncronous motor is non-salient and not a permanent magnet, it has no way to interact with the stator's rotating magnetic field at a standstill. However, once it is exposed to the rotating magnetic field generated by the stator, a current is induced in the rotor and a temporary magnetic field is generated. Once this temporary magnetic field has been generated, the two magnetic fields will interact via mutual torque and the rotor will spin.

<!-- TODO: discuss the limits of induction motor, cannot apply infinite load -->
If the rotor spun at the same speed at the stator, there would be no changing magnetic field *relative* to the stator, and the rotor would not become magnetic. Therefore, it must spin slower. The *slip* describes how much slower the rotor spins. If an external load is placed on the motor shaft, the rotor will slow down. This slowing down will cause a faster relative changing stator magnetic field, which will increase the rotors own magnetic field, which will increase the mutual torque, causing the rotor to spin again (this has it's limits).

Because the rotor is magnetized through electromagnetic induction, asyncronous motors are also called induction motors. Induction motors have either wound or squirrel cage rotors.

</div>


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Brushed or Brushless</div>
<hr class="small">

Commutation is the switching of current direction. Most motors require some form of commutation (homopolar motor's do not).

Brushed motors use physical slip contacts within the motor for commutation. These contacts change the current direction of the windings during a rotation. Brushed motors are usually supplied DC current through two wires, which is made into alternating AC cycles by the brushes in the motor.

<!-- TODO: acknowlege other possibilities like single phase AC -->
Brushless motors use electronic commutation outside the motor (via inverters, servo drives, RC ESCs). When using electronic commutation, some form of rotor-position reading is usually necessary for the commutation, unless sensorless control is used. Because the current is converted to AC outside of the motor, the motor is usually supplied AC current over three wires (for three phase motors).

</div>


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Reluctance or Non-Salient</div>
<hr class="small">

<!-- TODO: a explanation of why rotor moves to path of least reluctance... lowest energy? -->
<!-- Why does a material want to align with the magnetic field in the path that has the least reluctance (main idea of reluctance torque)? -->
The reluctance of a salient rotor changes as it rotates. Because of this variation, the rotor has a prefered, lowest-energy position it moves towards when placed in the magnetic field of the stator. This is called reluctance torque (used by reluctance motors, which have ferromagnetic rotors).

The reluctance of a non-salient rotor is constant, and therefore independent of the rotor angle position. Instead of reluctance torque, the rotor's magnetic field (generated by permanent magnets or temporarily by induction) interacts with the stator's magnetic field to generate mutual torque (used by non-salient motors). 

Motors that use both reluctance torque and mutual torque are called salient-pole motors.

Cogging torque, a type of reluctance torque, is an undesireable effect caused when a permanent-magnet rotor tries to align with the teeth of the stator. You can often feel cogging torque when turning an unpowered motor by hand.

<!-- FUTURE: Reluctance motors (tesla uses some SynRM motors) -->

</div>


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Sinusoidal or Trapezoidal (Back EMF)</div>
<hr class="small">

<!-- In permanent magnet rotors -->

The magnetic field of the rotor generates a back EMF voltage through the stator windings when spinning. Depending on the construction of the rotor, this back EMF profile is either trapezoidal or sinusoidal.

<!-- why does the control need to follow the no-current/natural back EMF profile of the rotor -->
<!-- The profiles of this back EMF matters in brushless control because... -->

Trapezoidal motors require much simpler hardware to control, because the inputted current only requires 6 changes per revolution, while the sinusoidal motors current changes continuously (these current profiles are discussed more [below](#current-profile-bookmark)).

For this reason, trapezoidal motors can use 6 hall effect sensors to detect when these switches need to occur.

On the other hand, sinusoidal motors need an encoder or resolver to continuously measure the shaft position. Sometimes, this isn't a problem, because the use-case may require that the motor already has a position sensor for higher-level control algorithms, like on a robot arm (note: sensorless control exists which removes the need for encoders/resolvers).

<!-- While trapezoidal motors less electronics to control, they do have some some downsides. -->
<!-- Surface or Interior (Permanent Magnet) -->

<div markdown="1" class="sub-block urgent">
the paper (page 37) seems to suggest the sinusoidal or trapezoidal nature of the motor comes from the permanent magnet distribution in the rotor. However, it later (page 282) talks about winding distributions. Other sources seem to say that concentrated windings create a trapezoidal EMF while distributed windings (a winding that skips over some teeth) creates sinusoidal EMF.

1. Do trapezoidal motors contain both a trapezoidal permanent magnet structure in the rotor, and concentrated windings?
2. Do sinusoidal motors contain both a sinusoidal permanent magnet structure in the rotor, and distributed windings?
3. What would the EMF profile look like for a sinusoidal PM structure with concentrated windings?
4. It looks like the ODrive uses concentrated windings, so can I then make the stretch that it uses six-step PWM (for trapezoidal motors)?

From page 306... *The focus of this report is on sinusoidal motors. A sinusoidal motor could be defined as one in which the flux density (and consequently the torque and bEMF functions) have a sinusoidal shape. By this definition a sinusoidal motor is not required to have sinusoidal windings. However, space vector theory can only describe the MMF produced by a sinusoidal winding. For this reason most of the academic literature concerning FOC makes the assumption of a sinusoidal winding and a sinusoidal rotor flux.*

1. How is it that reluctance is constant around a rotor (non-salient), but the bEMF changes (either trapezoidal or sinusoidal)?
    1. Maybe because the flux linkage of the motor is dependent on multiple things (flux produced by windings and flux produced by permanent magnets)? Equation 2.19 page 32 and 2.24 pg 33


</div>

</div>


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Axial or Radial (Flux)</div>
<hr class="small">

The rotor and stator of radial motors are concentric. There are both inner and outer rotor motors. Outer-rotor motors are easy to recognize because the outside of the motor spins when powered. The magnetic flux lines of radial motors moves radially across the airgap between the motor and stator.

<!-- TODO: There can be more than two pancakes? -->
The rotor and stator of axial motors are stacked like pancakes. Axial flux travels perpendicular to the rotor/stator surfaces.

</div>


<div markdown="1" class="sub-block neutral-alt med-top-m">
<div class="title">Motor Identification</div>
<hr class="small">

The motors from my four questions are...

1. RC
    1. Simple DC Brushed motor. 
    2. [Velineon][8] : "sensorless brushless motor". The VXL-3s does support sensored control. PWM at 12,000 Hz.
    3. [Castle Creations 1/18][11] : Sensorless with electronic timing. Synchronous motor drive. 4 pole motor. timing advance?
2. Formula Hybrid
    1. EMRAX 228 : Axial flux (I imagine this is the only axial flux motor I've ever used). Has resolver position sensor (not encoder). external rotor? PMSM (permanent magnet synchronous motor)?
    2. Bamocar D3 : Sensor (encoder or resolver) recommended. Three-phase servo amplifier (so not an inverter?). 4-quadrant drive unit. *"the amplifier is suitable for EC synchronous motors, AC asynchronous motors or DC motors."*
        1. *"The EC synchronous motor (brushless DC motor) in its electrical version is a synchronous motor with permanent magnet rotor and three-phase stator."*
        2. *"The physical properties correspond to those of the DC motor, i.e. the current is proportional to the torque and the voltage is proportional to the speed."*
        3. *"The power connection cable from the BAMOCAR to the battery should be as short as possible. Longer cables lead to dynamic voltage drops due to the cable impedance. These stress the built-in capacitors and shorten the service life."*
3. ODrive
    1. M8325s : outer rotor, BPMS?, radial flux?, sinusoidal?
    2. ODrive S1 : servo motor drive

</div>

<hr style = "margin-top: 4rem">
<br /><br />





## Motor Physics

Some motor terms and concepts...


<div markdown="1" class="sub-block neutral med-top-m large-bot-m">
<div class="title">Stators, Rotors, Poles, Slots, Teeth, Coordinate Frames </div>
<hr class="small">

- stators are stationary, and rotors rotate
- more poles (4 pole vs 2 pole) give more torque but less speed.
- Mechanical vs Electrical 360 degrees
- $$\theta_{elec} = (\frac{P}{2})/\theta_{mech}$$
    - $$P$$ is number of poles
- coils vs windings
- full pitch and short/chorded pitch
- concentrated, distributed, lap, and wave windings
    - https://www.youtube.com/watch?v=rFSTg8BNhoQ
    - https://www.researchgate.net/post/What-is-the-difference-between-stator-windings-of-BLDC-and-PMSM-motors
    - concentrated windings have a trapezoidal back emf
    - distributed windings have a sinusoidal back emf
- double-layer lap winding (common in brushless DC motors)

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Rotor Arrangements and Salience</div>
<hr class="small">

- (pg 17 of bible)
- Reluctance and Mutual Torque
- mutual torque is produced by interaction of rotor field and stator field (non-salient machine)
- reluctance torque is produced by 1 field and a variable reluctance (reluctance machine)
- salient-pole machines use both mutual and reluctance torque

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Rotor Arrangements and Waveform Shape</div>
<hr class="small">

- Sinusoidal vs non-sinusodial motors (Appendix B) are different because of their windings    
    - sinusodial vs trapezoidal permanent magnet arrangements
        - this is the core difference between the two, the physical arrangements of motor causes the rotor-stator flux linkage shape to be either sinusoidal or trapezoidal <!-- for one 360 electrical rotation? -->
    - sinusoidal vs trapezoidal flux density waveform -> torque waveform -> bEMF waveform
    - sinusoidal bEMF and torque equations (derived from BLi and BLv)
        - $$K_t$$ and $$K_e$$ constants, and their meaning
        - Question on derivation via integral of flux (pg 42)
    - sinusoidal vs trapezoidal current profiles for a constant torque
        - explain my "thoughts" on the downsides of constant current
    - sinusoidal vs trapezoidal electric commutator schematics
    - other
        - sinusodial motors do not need to have sinusodial windings, but space-vector theory requires sinusodial windings in order to describe magnetomotive forces (MMF) (pg 306)


    a trapezoidal motor uses 120 six-step PWM commutation for the stator
    a sinusoidal motor uses 180 PWM commutation for the stator
    the rotor 

</div>

<span id="current-profile-bookmark"></span>
<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Sinusoidal and Trapezoidal Current Profiles</div>
<hr class="small">

- As mentioned above, the motor construction determines wether a motor has a sinusoidal or trapezoidal flux density <!-- for one 360 electrical rotation? -->
- sinusoidal vs trapezoidal flux density waveform -> torque waveform -> bEMF waveform
- sinusoidal bEMF and torque equations (derived from BLi and BLv)
    - K_t and K_e constants, and their meaning
    - Question on derivation via integral of flux (pg 42)
- sinusoidal vs trapezoidal current profiles for a constant torque
    - explain my "thoughts" on the downsides of constant current
- sinusoidal vs trapezoidal electric commutator schematics
- other
    - sinusodial motors do not need to have sinusodial windings, but space-vector theory requires sinusodial windings in order to describe magnetomotive forces (MMF) (pg 306)

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Equivalence of Back EMF and Torque</div>
<hr class="small">

- induction of voltage
- they are both a function of rotor position
- they are both dependent on rotor-to-stator flux linkage (pg 9 and 46)
- Single Phase Models
    - Torque production and back-EMF generation
        - how motors produce torque
- Multi Phase Models
    - **3-phase ac** motors vs single-phase AC and DC motors

</div>


<div markdown="1" class="sub-block neutral large-top-m large-bot-m">
<div class="title">Permanent Magnet Stator Flux Linkage</div>
<hr class="small">

- pg 33
- Li + rotor-stator flux linkage

</div>


<hr style = "margin-top: 4rem">
<br /><br />





## Motor Control

- Inverters and PWM. Chapter 4

- PURPOSE: quick summary of why inverters are necessary, and why the ODrive is constantly pulling different current. 

- CONTENT
    <!-- the inputted voltage must match the backEMF? -->
    - Electrical Commutation for AC motors
        - brushed DC motors can use physical brushes for commutation
        - AC motors don't use brushes, and need electrical commutation to reverse the terminal current every 180 degrees
        - 120 degree six step commutation
            - Leg states for a 120 degree inverter (pg 164)
            - transistor switches
    - Control System summary
        - DC motors (brushs) - control by controlling the average voltage
        - Single-phase AC motors - phase angle control/phase chopping (simple: just cutting up/limiting the AC power supply)
        - Three-phase AC (async induction and sync motors)
            - unlike the above two, the power supply waveforms are no longer just adjusted, but combined into completely different waveforms
            - this changes the amplitude and frequency of the waveform, and for vector/FOC, also the phase
            - VVVF, VFD, ASD, vector drive 
    - Inverters
        <!-- - inverters and PWM allowed for variable frequency operation (aka different speeds?) around 1958 -->
        - voltage source inverters are usually used, even though it is current which is what we want to control
        - inverter control methods (six-step squarewave, six-step PWM, PWM, SVM)
        - 120 vs 180 degree inverters
    - Servo Amplifier vs Inverter
        - servo drives seem to be a more complete solution. They often include FOC or some form of closed loop control, [brake control circuits][13]
        - servo drives contain inverters on them to convert the DC supply to AC
        - VFD (usually for speed control) vs Servo Drive (usually for high accuracy position control)
- OTHER
    - why do we need to generate sine wave currents for three phase motors?
        - "Sinusoidal BPMS Motors with Sinusoidal Currents" from FOC bible

<div markdown="1" class="sub-block urgent">

1. What is the difference between an inverter and a servo drive/controller/amplifier? When are both best used? It seems like servo drives are more complex and may include inverters, but also include closed loop control and some FOC implementation? More of a "full" solution?
2. Is there any common example hardware I can mention here that is commonly used for PWM, FOC, inverters (like if i go to digikey and look up "PWM chip")? Or are electronic communtation circuits (like the VSI on 161) created from the raw parts normally (diodes, transistors, etc)?
3. 🚨🚨🚨 what hardware on the ODrive S1 constitutes the inverter?

</div>
 
<!-- I believe an understanding of PWM is enough to understand why the ODrive will constantly be pulling changing current over DC+/-, we don't yet need to understand FOC -->
<!-- But by this point, I would like to have an understanding not only of that the ODrive pulls changing currents over DC+/- because of PWM, but also how it does it -->

<hr style = "margin-top: 4rem">
<br /><br />






## Parasitic Resistance, Impedance, and Capacitance

- PURPOSE: The point here is to establish that the ODrive S1 is constantly changing the amount of current it pulls (because of PWM, but don't go into PWM details yet), that this can cause voltage spikes due to parasitic resistance/capacitance, and why this must be considered (ground loops).

- CONTENT
- All wires have parasitic resistance, parasitic impedance, and parasitic capacitance.
    - Because wires have parasitic resistance, the voltage across them will drop.
    - Because wires have parastic impedance, when we being drawing current over the wire, the voltage will temporarily drop
        - this newly introduced voltage rise across our inductor, the wire, is fighting against the new current flow.
        - When we stop drawing current, the voltage will temporarily rise. This corresponding voltage drop across the inductor is fighting against the new current stoppage... it wants current to keep flowing.
        - Inductors are kind of like inertia, they want the current to keep doing whatever it is already doing. They resist change in current
- This is a form of an RLC circuit.
- what are the variables that increase parastic resistance and impedance
- impedance vs inductance?

- IMAGES
- Simple Square Wave example with...
    - resistance
    - resistance + inductance
    - resitance + inductance + capacitance

<hr style = "margin-top: 4rem">
<br /><br />





## Capacitors to Mitigate Effects of PWM

- PURPOSE: The point here is to explain the purpose of using short DC+/- wires, the capacitors, and the inductive kicks and voltage spikes that still exists after these mitigations, which can cause current to flow on ground loops.

- CONTENT
1. THE CURRENT ON THE ODrive S1 DC+/- IS CONSTANTLY CHANGING
    - The ODrive is constantly pulling different amounts of current because of PWM. The current that the ODrive draws looks like a 48kHz square wave.
    - If these large dI/dt changes were on the DC+/- wires powering the ODrive, the voltage spikes and drops during the current changes would be very large due to the impedance of the wires. Voltage spikes could be 100s of volts.
2. INCLUDING CAPACITORS REDUCES THE VOLTAGE SPIKES DUE TO THE IMPEDANCE OF THE DC+/- WIRES
    - Luckily, voltage spikes of 100s of volts don't happen, because of the four large capacitors connected in parallel to the DC+/- on the ODrive S1. Capacitors smooth out voltage spikes.
    - Now, the capacitors help supply the current for the square wave, and the capacitors are recharged from DC+/- when not delivering current.
    - Because the DC+/- wires now charge the capacitors where the square wave is "off", and only partially have to supply the square wave current when it is "ON", means that the di/dt on the long wires is reduced, which reduces the voltage spike impedances.
    - The PCB traces after the capacitors still have impedance, but these traces are much shorter than the DC+/- wires, that it doesn't really matter.
3. THERE IS STILL SOME INDUCTIVE "KICK", WHICH RESULTS IN VOLTAGE SPIKES/DROPS THAT CAN CAUSE CURRENT TO FLOW DOWN OTHER PATHS TO GROUND IF THERE ARE GROUND LOOPS.
    - "however, there's still a di/dt at the DC+/- wire, so you get a little inductive "kick" every time it switches"
    - So while there isn't large 100 volt spikes, there are still spikes, the size of which is dependent on how much current the ODrive pulls and the length and thickness of the DC+/- wires (V=L*di/dt)
    - Maybe the spikes are 500mV in amplitude.
    - These 500mV differences in ground can form a ground loop.

<div markdown="1" class="sub-block urgent">

1. How can I create a falstad circuit with inductive kicks at high speed?
    1. 🚨🚨🚨
    2. In my [first circuit](https://tinyurl.com/22ftb2sl), I can achieve inductive kicks that demonstrate voltage spikes, but only at low Hz
    3. In my [second circuit](https://tinyurl.com/23wgs22p), I can't achieve inductive kicks at all (see first graph for the voltage across the capacitor).
    4. I approximated capacitor values based on the circuit schematic from [ODrive V3.5](https://github.com/odriverobotics/ODriveHardware/blob/master/v3/v3.5docs/schematic_v3.5.pdf)
5. What is a good resource to start learning about how to choose a capacitor value?
    1. Is this where overdamped, underdamped, and critically damped RLC circuits comes into play?

</div>
    
<hr style = "margin-top: 4rem">
<br /><br />





## The Downsides of Ground Loops

- PURPOSE: The purpose of this is to explain the effects of ground loops

- CONTENT
- Ground loops can cause interferance in communication lines.
    - Ground loops can mess with communications by creating a unwanted loop for current to flow
- Ground loops can cause overvoltage on Arduino pins and fry them.
    - applying more than 5.5V to Arduino IO pins can fry the Arduino.
- Why does overvoltage fry an Arduino
    - https://www.arduino.cc/en/uploads/Main/arduino-uno-schematic.pdf
    - https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf
    - https://docs.arduino.cc/learn/microcontrollers/5v-3v3/
- ODrive S1 CAN GND Daisy Chaining
    - From a Solomon comment: The ODrive CAN Gnd *"is not connected to anything but the CAN gnd on the other connector. you're not supposed to terminate your CAN GND into an S1 screw terminal, that's bad and unreliable wiring. in an actual robot you' terminate it in your power distribution busbar. the moment you have two s1s daisy chained on the same power bus, it forms a loop. the idea here is your CAN cable can go from your rpi or whatever to the first ODrive, and then you daisy chain through the rest of the chain, then after the final ODrive you terminate the CAN_GND to your system's power distribution board. It's unnecessary to run the DC-/CAN GND daisy chained, you can just have your robot controller on the same DC net, it's just a wiring nicety in certain situations"*

<div markdown="1" class="sub-block urgent">

1. Somebody mentioned that they had a AUV vehicle where the arduinos would fail when the motors were stopped just by being placed near them (so high current would cause a quickly forming (changing) magnetic field and create back EMF in the arduino or something?). Was this because the designer failed to add appropriate capacitors (or had too long of DC+/- wires), or because they had no brake resistors?
2. Good resources to learn about brake resistors?

</div>

<hr style = "margin-top: 4rem">
<br /><br />





## Space Vector Model of a BPMS Motor

- Chapter 3
- PURPOSE: quick summary of the space vector model for a sinusodial BPMS motor which is used in FOC

<hr style = "margin-top: 4rem">
<br /><br />





## FOC and BLDC Current Control

- Chapter 5
- PURPOSE: The purpose of this is to explain  

- CONTENT
- The ODrive uses FOC control, which uses current control under it.

- QUESTIONS
    - FOC for induction motors vs synchronous motors? FOC for sinusoidal drives vs non-FOC sinusodial commutation? (pg 3)
    - Why do we use PWM + FOC instead of just PWM?

<div markdown="1" class="sub-block urgent">

1. We already know the best current profile to apply
    1. and we are able to achieve these current profiles (six step for trap and PWM approx of sine wave for sinusoidal motors)
2. We already know that the stators magnetic field should be 90 electrical degrees behind the rotors magnetic field
3. We already know the rotors position (via hall effect sensors, resolvers, or encoders)
4. **Therefore,** why is it necessary to add FOC (park/clarke transforms) if we already knot the ideal stator field position and how to create it?
5. Said another way, PWM seems to have a very fixed idea of what the current profile should look like for each phase during the 360 degree rotation (trapezoidal or sinusodial via 2.30 and 2.31). So then why is FOC necessary?

<br /><br />

1. motors that use PWM are shaping a sine wave (either via a six-step PWM inverter or PWM inverter, pg 166). If all three phases are doing PWM at once, do these jolty current 'requests' not smooth out into a single constant current for the DC +/-? For sinusoidal motors, each phase pulls sinusoidal current profile (pg 53), so there actually is bumpiness. But for trap motors, the current pulled is constant. So why is the current on the DC+/- wires changing so quickly?

</div>

<hr style = "margin-top: 4rem">
<br /><br />





## Implementation

- How is PWM implemented on Arduinos, S1, Bamocar
- How is FOC implemented on S1 and Bamocar

<hr style = "margin-top: 4rem">
<br /><br />





## High and Low Inductance Motors

- Low Inductance Motors
    - Current Controller ADC Noise -> Torque Ripple and audible noise due to Magnetostriction

- Higher Inductance Motors
    - Current Controller ADC Noise -> Smoothed-out Torque Ripple
    - For high inductance motors (over 300uH), you may need to slow down the current controller bandwidth so it doesn't command impossible currents.
    - Less motor power loss P = I^2R
    - https://tinyurl.com/22tdaaue
    - QUESTION: while the higher impedance motor is loosing less power through the resistor since there is less current flowing through it due to the higher value inductor, isn't the motor also producing much less torque?

<hr style = "margin-top: 4rem">
<br /><br />





## Managing EMF

- CONTENT
    - Review of how EMF occurs (should be described in section B)
         - Solomon
            - "Voltage switching to the motor is a square wave, square waves are comprised of much higher frequencies, so even if you're switching on and off at 48kHz, you still have frequency components in the 100s of MHz"
            - "plus the motor phase voltages get an inductive "kick" while switching, which generates more HF components, etc"
    - Common mode choke
    - When does it become necessary to add a choke?
        - Solomon
            - "Man, with Pro/S1, hopefully never, those are way better in terms of EMI than the v3.6"
            - "it matters if you're failing FCC or CE emissions testing"
    -  VFDs
        - Capacitive coupling

<div markdown="1" class="sub-block urgent">

1. 🚨🚨🚨  Why is the ODrive S1/Pro better than the v3.6 at handling EMF?

</div>

<hr style = "margin-top: 4rem">
<br /><br />





## Other Topics to cover

- brainstorm
    - Magnetostriction
    - Brake Resistors
    - Ground Isolator Chip (ODrive S1)
    - Motor Drivers
    - voltage source inverters
    - 3 phase... why not 6 phase? 9 phase?
    - PWM current ripple (169)
    - PWM harmonic distortion
    - ZS Signal
    - rotor losses (type A) and field losses (type B)
    - armature reaction 
    - BAMOCAR DC Link Capacity?
    - hysteresis
    - Q and D axis
    - Winding Configurations
        - Wye motor winding
- eddy currents
    - From a Solomon comment: stators (electrical steel/silicon steel) with high permeability (flux lines) and low resistance (less heat). Stacked in sheets to reduce area A (for faraday's law), so less eddy currents generated
    - I think stacks of sheets are also used in transformers to create the ?ferromagnetic? loop that the two coils wrap around
- winding patterns (pg 286)
    - https://www.bavaria-direct.co.za/scheme/calculator/
    - winding factor
- brake resistors
    - From an Excessive Overkill comment: *"Any time a motor is actively slowing down it needs somewhere to push the power. You only need it if your power source can’t handle current flowing back into it, most power supplies can’t, but most batteries can. Or if you have a case where there truly is very little regen, but even small spikes can cause issues sometimes"*
    - From a Solomon comment: *"If you're using a power supply, you typically always need one, unless it's a fancy bidirectional or two-quadrant power supply. you set dc_max_negative_current to whatever the max regen current of the battery is"*
    - what does setting dc_max_negative_current actually change, in software and on hardware?
- sensorless

<div markdown="1" class="sub-block urgent">

1. 🚨🚨🚨 Why does switch voltage profiles (why does the peak sometimes overshoot/oscillate and sometimes the peak is the eventual steady value)
    1. Example of [some switch profiles](https://www.powerelectronicsnews.com/switching-edge-control-for-emc-power-supply-design-tutorial-section-4-2/)

</div>

<!-- links -->
[1]: SENSORLESS FIELD ORIENTED CONTROL OF BRUSHLESS PERMANENT MAGNET SYNCHRONOUS MOTORS
[2]: https://en.wikipedia.org/wiki/Lorentz_force
[3]: https://en.wikipedia.org/wiki/Magnetic_flux
[4]: https://en.wikipedia.org/wiki/Radial_flux_motor
[5]: https://www.emworks.com/blog/electromechanical/axial-and-radial-flux-permanent-magnet-machines-what-is-the-difference
[6]: https://en.wikipedia.org/wiki/Magnetic_reluctance
[7]: https://archive.org/details/ElectricityAndMagnetismPurcell3rdEdition/page/n585/mode/2up
[8]: https://traxxas.com/sites/default/files/3355X-VXL-3s-INST-120813-EN-FR.pdf
[9]: https://traxxas.com/sites/default/files/KC2015-R02_3351R%20Velineon%203500%20Brushless%20Motor%20Installation%20Instructions_WEB_EN.pdf
[10]: https://home.castlecreations.com/castle-technology
[11]: https://www.castlecreations.com/en/1-18th-scale-1/0808-5300kv-motor-060-0038-00
[12]: https://www.youtube.com/watch?v=0y9x7CS5Vrk&list=PLyQSN7X0ro2314mKyUiOILaOC2hk6Pc3j&index=13
[13]: https://www.fanucamerica.com/products/cnc/servo-drive-motor/servo-amplifiers
[14]: https://www.motioncontroltips.com/servo-drives-also-called-servo-inverters-amplifiers-controllers/

<br>

<div markdown="1" class="sub-block urgent med-top-m">

Book Questions

1. Do you use software to analyze magnet flux lines?
2. Page 19 - Why is the interior motor D salient but C is non salient?
3. Page 32 - Equation 2.20 explains how the total flux linkage comes partially from the stator coil (Ni), and partially from the permanent magnet (based on N and the magnets reluctance).
    1. Why is N multiplied by the 
    2. Why is L, the inductance of the stator coils, dependent on the rotor position?
4. Pg 42 - When defining rotor-stator flux at a given angle $$\theta$$, why is the integration done over only 1/2 of the motor surface, centered around $$\theta$$?
5. Pg 66/67 - We are shown a chart that shows the MMF of all three phases. What does the $$\theta$$ angle represent?
6. Pg 167 - Why is the 180 degree inverter better for approximating a sine wave output? The fundamental is lower for the 120 inverter?
7. Pg 169/170 - I do not understand the commutation current profiles. To start, what does top Q and bottom Q mean? Why would we want one switch to do PWM while the other does plain commutation?
8. Pg 286 - What does it mean that there is a new degree of freedom added?
    1. What is the winding path in C6b?
    1. How is C6a not distributed? It skips many teeth.

</div>
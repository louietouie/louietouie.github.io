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

Two simple examples, the **BLv and BLi Laws**.

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





## Motor Physics

Some motor terms and concepts...


<div markdown="1" class="sub-block neutral-alt med-top-m large-bot-m">
<div class="title">Stators, Rotors, Poles, Slots, Teeth, Coordinate Frames </div>
<hr class="small">

- stators are stationary, and rotors rotate
- more poles (4 pole vs 2 pole) give more torque but less speed.
- Mechanical vs Electrical 360 degrees

</div>


<div markdown="1" class="sub-block neutral-alt large-top-m large-bot-m">
<div class="title">Rotor Arrangements and Salience</div>
<hr class="small">

- (pg 17 of bible)
- Reluctance and Mutual Torque
- mutual torque is produced by interaction of rotor field and stator field (non-salient machine)
- reluctance torque is produced by 1 field and a variable reluctance (reluctance machine)
- salient-pole machines use both mutual and reluctance torque

</div>


<div markdown="1" class="sub-block neutral-alt large-top-m large-bot-m">
<div class="title">Rotor Arrangements and Waveform Shape</div>
<hr class="small">

- Sinusoidal vs non-sinusodial motors (Appendix B) are different because of their windings    
    - sinusodial vs trapezoidal permanent magnet arrangements
        - this is the core difference between the two, the physical arrangements of motor causes the rotor-stator flux linkage shape to be either sinusoidal or trapezoidal <!-- for one 360 electrical rotation? -->
    - sinusoidal vs trapezoidal flux density waveform -> torque waveform -> bEMF waveform
    - sinusoidal bEMF and torque equations (derived from BLi and BLv)
        - K_t and K_e constants, and their meaning
        - Question on derivation via integral of flux (pg 42)
    - sinusoidal vs trapezoidal current profiles for a constant torque
        - explain my "thoughts" on the downsides of constant current
        - QUESTION: if this is ideal, why is FOC necessary?
    - sinusoidal vs trapezoidal electric commutator schematics
    - other
        - sinusodial motors do not need to have sinusodial windings, but space-vector theory requires sinusodial windings in order to describe magnetomotive forces (MMF) (pg 306)

</div>


<div markdown="1" class="sub-block neutral-alt large-top-m large-bot-m">
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


<div markdown="1" class="sub-block neutral-alt large-top-m large-bot-m">
<div class="title">Permanent Magnet Stator Flux Linkage</div>
<hr class="small">

- pg 33
- Li + rotor-stator flux linkage

</div>


<!-- - CONTENT
    - Q and D axis
    - Winding Configurations
        - Wye motor winding

- QUESTIONS
    - Why does a material want to align with the magnetic field in the path that has the least reluctance (main idea of reluctance torque)?
    - How is it that reluctance is constant around a rotor (non-salient), but the bEMF changes (either trapezoidal or sinusoidal)?
        - Maybe because the flux linkage of the motor is dependent on multiple things (flux produced by windings and flux produced by permanent magnets)? Equation 2.19 page 32 and 2.24 pg 33 -->

<hr style = "margin-top: 4rem">
<br /><br />





## Motor Types

Motors come in many varieties, and they often can be categorized as either...


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Synchronous or Asynchronous</div>
<hr class="small">

<!-- actually might be one to one, and every K spins for the AC cycle. -->
In synchronous motors, the rotor and stator's spinning magnetic field both spin once for every integer K cycles of the electronically commutated current.

The rotor of a asyncronous motor has no simple integer relationship between the rotor and stator spin rates. Instead, the rotor spins slower than the stator's field.

Because the rotor of an asyncronous motor is non-salient and not a permanent magnet, it has no way to interact with the stator's rotating magnetic field at a standstill. However, once it is exposed to the rotating magnetic field generated by the stator, a current is induced in the rotor and a temporary magnetic field is generated. Once this temporary magnetic field has been generated, the two magnetic fields will interact via mutual torque and the rotor will spin.

If the rotor spun at the same speed at the stator, there would be no changing magnetic field *relative* to the stator, and the rotor would not become magnetic. Therefore, it must spin slower. The *slip* describes how much slower the rotor spins. If an external load is placed on the motor shaft, the rotor will slow down. This slowing down will cause a faster relative changing stator magnetic field, which will increase the rotors own magnetic field, which will increase the mutual torque, causing the rotor to spin again (this has it's limits).

Because the rotor is magnetized through electromagnetic induction, asyncronous motors are also called induction motors.

<!-- - Synchronous motors (rarely brushes, AC)
    - Brushless Permanent Magnet Synchronous motor + inverter (electronically commutated, aka no physical brushes) (usually non-salient rotors) (main focus of the FOC Bible)
    - Permanent vs Non-permanent/Ferromagnetic -->

</div>


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Brushed or Brushless</div>
<hr class="small">

Commutation is the reversal of current direction. Most motors require some form of commutation (homopolar motor's do not).

Brushed motors use physical slip contacts within the motor for commutation. These contacts change the current direction of the windings during a rotation. Brushed motors are usually supplied DC current through two wires, because the alternating AC cycles are generated within the motors by the brushes.

<!-- acknowlege other possibilities like single phase AC -->
Brushless motors use electronic commutation outside the motor (via inverters, servo drives, RC ESCs). When using electronic commutation, some form of rotor-position reading is usually necessary for the commutation, unless sensorless control is used. Because the current is converted to AC outside of the motor, the motor is usually supplied AC current over three wires (for three phase motors).

</div>


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Reluctance or Non-Salient</div>
<hr class="small">

<!-- lowest energy?? -->
The reluctance of a salient rotor changes as it rotates. Because of this variation, the rotor has a prefered, lowest-energy position it moves towards when placed in the magnetic field of the stator. This is called reluctance torque (used by reluctance motors).

The reluctance of a non-salient rotor is constant, and therefore independent of the rotor angle position. Instead of reluctance torque, the rotor's magnetic field (generated by permanent magnets or temporarily by induction) interacts with the stator's magnetic field to generate mutual torque (used by non-salient motors). 

Motors that use both reluctance torque and mutual torque are called salient-pole motors.

<!-- cogging torque? -->

<!--
Reluctance motors (tesla uses some SynRM motors)
induction motor rotors get magnetized via induction, and reluctance motor rotors are just ferromagnetic, and align with the magnetic field (do they become magnetic?) -->

</div>


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Sinusoidal or Trapezoidal (Back EMF)</div>
<hr class="small">

<!-- In permanent magnet rotors -->

The magnetic field of the rotor generates a back EMF voltage through the stator windings when spinning. Depending on the construction of the rotor, this back EMF profile is either trapezoidal or sinusoidal.

<!-- why does the control need to follow the no-current/natural back EMF profile of the rotor -->
<!-- The profiles of this back EMF matters in brushless control because... -->

Trapezoidal motors require much simpler hardware to control, because the inputted current only changes 6 times per revolution, while the sinusoidal motors current changes continuously.
For this reason, trapezoidal motors can use 6 hall effect sensors to detect when these switches need to occur.
On the other hand, sinusoidal motors need an encoder or resolver to continuously measure the shaft position. Sometimes, this isn't a problem, because the use-case may require that the motor already has a position sensor for higher-level control algorithms, like on a robot arm (note: sensorless control exists which removes the need for encoders/resolvers).

<!-- While trapezoidal motors less electronics to control, they do have some some downsides. -->

<!-- Surface or Interior (Permanent Magnet) -->

</div>


<div markdown="1" class="sub-block neutral med-top-m">
<div class="title">Axial or Radial (Flux)</div>
<hr class="small">

</div>


<div markdown="1" class="sub-block neutral med-top-m med-bot-m">
<div class="title">Inner or Outer (Rotor)</div>
<hr class="small">

</div>

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
- QUESTIONS
    - what inverter method does the ODrive use?
    - what hardware on the ODrive S1 constitutes the inverter?
    - why do we need to generate sine wave currents for three phase motors?
        - "Sinusoidal BPMS Motors with Sinusoidal Currents" from FOC bible
    - How does PWM 'request' a square wave of current?
 
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

- IMAGES
- Simple Square Wave example with...
    - resistance
    - resistance + inductance
    - resitance + inductance + capacitance

- QUESTIONS
    - what are the variables that increase parastic resistance and impedance
    - impedance vs inductance?

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
    - QUESTION: Why doesn't the capacitor have an impedance kick across it on the second link (the one with the triangle wave voltage, like the ODrive voltage profile does)
        - WARNING: talking about these wave profiles might be sensiive... check with Solomon
        - https://tinyurl.com/22ftb2sl
        - https://tinyurl.com/23wgs22p
        - Approximate capacitor values to use
            - https://github.com/odriverobotics/ODriveHardware/blob/master/v3/v3.5docs/schematic_v3.5.pdf
    
- QUESTIONS
    - How are capacitor values chosen?
    
<hr style = "margin-top: 4rem">
<br /><br />





## The Downsides of Ground Loops

- PURPOSE: The purpose of this is to explain the effects of ground loops

- CONTENT
- Ground loops can cause interferance in communication lines.
    - Ground loops can mess with communications by creating a unwanted loop for current to flow
- Ground loops can cause overvoltage on Arduino pins and fry them.
    - applying more than 5.5V to Arduino IO pins can fry the Arduino.

- QUESTIONS
    - Why does overvoltage fry an Arduino
        - https://www.arduino.cc/en/uploads/Main/arduino-uno-schematic.pdf
        - https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf
        - https://docs.arduino.cc/learn/microcontrollers/5v-3v3/
    - Can Arduinos be fried if high current wires exist near them, but don't directly connect to them? AKA a changing magnetic field itself causes the Arduino to fail if the Arduino is close enough to the cables?
        - Somebody mentioned that they had a AUV vehicle where the arduinos would fail when the motors were stopped.

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
    - Why does the ODrive S1 switch? FOC?
        - https://www.powerelectronicsnews.com/switching-edge-control-for-emc-power-supply-design-tutorial-section-4-2/
    - Why do we use PWM + FOC instead of just PWM?

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

- QUESTIONS
    - Why is the ODrive S1/Pro better than the v3.6 at handling EMF?

<hr style = "margin-top: 4rem">
<br /><br />





## Motor Drivers

## Ground Isolator Chip

## Brake Resistors

## Magnetostriction

## Other

- QUESTIONS
    - voltage source inverters
    - 3 phase... why not 6 phase? 9 phase?
    - motors that use PWM are shaping a sine wave (either via a six-step PWM inverter or PWM inverter, pg 166). If all three phases are doing PWM at once, do these jolty current 'requests' not smooth out into a single constant current for the DC +/-?
    - PWM current ripple (169)
    - PWM harmonic distortion
    - PWM seems to have a very fixed idea of what the current profile should look like for each phase during the 360 degree rotation (trapezoidal or sinusodial via 2.30 and 2.31). So then why is FOC necessary?
    - ZS Signal
    - rotor losses (type A) and field losses (type B)
    - armature reaction 
    - BAMOCAR DC Link Capacity?
    - switch voltage profiles (why does the peak sometimes overshoot/oscillate and sometimes the peak is the eventual steady value)
    - eddy currents
    - magnetostriction
    - hysteresis

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
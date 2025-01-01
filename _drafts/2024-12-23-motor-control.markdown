---
layout: post
title:  "Drawing Squares"
date:   2024-12-18 12:00:00 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

![Long Exposure Laser Square Drawn by Robot](/assets/images/laser_square.jpeg)

<hr style = "margin-top: 4rem">
<br /><br />

## 🌓A : OVERVIEW

My understanding of motors is subpar.

1. In the RC world, I've used cheaper brushed motors, like those in a Super Cub RC Plane and a Traxxis RC car, and brushless motors, like a Velineon VXL and a Castle Creations. I've never understood why the brushed motors only have 2 wires, but the brushless motors have 3.
2. In Formula Hybrid, the car had a Bamocar D3 motor controller and Emrax 228 motor. The accumulator had a discharge loop to discharge the capacitors within the Bamocar D3 when the two large safety relays were opened, but I never had a good sense of why there were capacitors in the first place. Why can't the lithium-ion batteries just power the Bamocar directly? Why is the Bamocar D3 from Formula Hybrid called a three-phase servo amplifier and not an inverter?
3. Lastly, an ODrive has made appearances in the last two blog posts. Because of the parasitic resistance and impedance of the DC+/- wires, ground loops are something that need to be considered when using an ODrive. These parastic effects can cause the voltage potential at the DC- port on the ODrive not to be 0V. This means some current may take other paths to ground, like through a USB cable to an arduino, and back through the arduino's ground. But if my motor is spinning at a pretty constant speed, why is the current through the DC+/- wires changing enough to make parasitic impedance a problem in the first place? And why does the ODrive need a brake resistor?

My goal with this post is to learn enough about motors, motor controls (PWM, FOC, current control), and motor hardware (capacitors and brake resistors) that I can respond to the four confusions above, which I hope to do at the end of this post.

One note is this post is heavily influenced by James Mevey's paper on FOC. Probably 70% of this post is me just trying to simplify and summarize what I learned from that paper, which was super helpful (and thanks Solomon from ODrive for recommending it).

## 🌓AA : MOTOR TYPES

- PURPOSE: Establish what we are talking about. We are talking about the circuitry for a **sinusodial BPMS (brushless permanent magnet synchronous) motor**

- CONTENT

- Brushed DC motors
- Induction motors (no brushes, asynchronous, AC)
- Reluctance motors (tesla uses some SynRM motors)
- Synchronous motors (rarely brushes, AC)
    - Brushless Permanent Magnet Synchronous motor + inverter (electronically commutated, aka no physical brushes) (usually non-salient rotors) (main focus of the FOC Bible)

Most of the details below describe a inner-rotor, radial flux, BPMS motor (just because that's what Mevey's paper does).

Most motors require some form of commutation (homopolar motor's do not). Commutation is the reversal of current direction. This can be achieved within the motor using physical brushes or outside the motor using electronic commutation (via inverters, servo drives, RC ESCs).
When using electronic commutation, some form of rotor-position reading is necessary for the commutation (sensor and sensorless control).

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
    1. M8325s : outer rotor
    2. ODrive S1 : servo motor drive

## 🌓B : GENERAL MOTOR MODEL PHYSICS (Chapter 2)

- PURPOSE: quick summary of basics that are cruical to understanding **three-phase AC** motors

- CONTENT
    - **3-phase ac** motors vs single-phase AC and DC motors
    - Physics Laws
        - Faraday and Lenz Laws
        - Lorentz Force Law
            - Lorentz Force - Magnetic Field only, no Electric Field
                - A charged particle that *moves* through a magnetic field will have a force exerted on it. For a positively charged particle, the right hand rule can be used to discover the force direction based on the velocity direction and magnetic field direction.
                - F = q*v*B (if the velocity is perpendicular to the magnetic field)
                - Aka, the charge of the particle, velocity, and strength of the magnetic field (measured in Teslas) all influence the Lorentz force on the particle.
    - Single Phase Models
        - BLv and BLi Laws
        - Magnetic Flux
            - Magnetic flux is the magnetic field through a surface.
            - A changing magnetic flux through a wire loop will cause an EMF, aka an electromotive force (slightly different than voltage), which induces a current in the loop.
            - In radial flux motors (as opposed to axial flux motors), the flux is oriented perpendicular to the motor's shaft. Radial motors are more common and older than the more compact axial motors. However, axial motors have more mass at farther radius, so they have more inertia, and lower RPMs.
            - flux linkage of winding current vs stator
            - Airgaps
            - Rotor flux leakage/permeance
            - Flux path, air gaps, permeability, reluctance, field direction
        - Torque production and back-EMF generation
            - how motors produce torque
    - Multi Phase Models
    - Motor Configuration
        - Stator Arrangements and Salience (pg 17 of bible)
            - mutual torque is produced by interaction of rotor field and stator field (non-salient machine)
            - reluctance torque is produced by 1 field and a variable reluctance (reluctance machine)
            - salient-pole machines use both mutual and reluctance torque
        - motor slots and teeth
        - more poles (4 pole vs 2 pole) give more torque but less speed.
        - stators are stationary, and rotors rotate
        - Radial flux rotors are most common, meaning that the rotor and stator are concentric, and the flux is oriented radially to both (along the radii of the circular rotor/stator)
        - Inner rotor, outer rotor, brushless
        - synchronous vs asynchronous
    - Winding Configuration
        - Sinusoidal vs non-sinusodial motors (Appendix B) are different because of their windings
            - sinusodial vs trapezoidal motors
            - sinusodial motors do not need to have sinusodial windings, but space-vector theory requirs sinusodial windings in order to describe magnetomotive forces (MMF) (pg 306)
        - Wye motor winding

- QUESTIONS
    - Why does a charged particle need to be moving for a magnetic field to exert a force on it (via Lorentz)?

## 🌓D : GENERAL MOTOR CONTROL: INVERTERS and PWM (Chapter 4)

- PURPOSE: quick summary of why inverters are necessary, and why the ODrive is constantly pulling different current

- CONTENT
    - electrical commutation for AC motors
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
    - voltage source inverters are usually used, even though it is current which is what we want to control
    - inverters and PWM allowed for variable frequency operation (aka different speeds?) around 1958
    - inverter control methods (six-step squarewave, six-step PWM, PWM, SVM)
    - 120 vs 180 degree inverters

- QUESTIONS
    - what inverter method does the ODrive use?
    - what hardware on the ODrive S1 constitutes the inverter?
    - why do we need to generate sine wave currents for three phase motors?
        - "Sinusoidal BPMS Motors with Sinusoidal Currents" from FOC bible
 
<!-- I believe an understanding of PWM is enough to understand why the ODrive will constantly be pulling changing current over DC+/-, we don't yet need to understand FOC -->
<!-- But by this point, I would like to have an understanding not only of that the ODrive pulls changing currents over DC+/- because of PWM, but also how it does it -->

## 🌓E : PARASITIC RESISTANCE AND IMPEDANCE (and CAPACITANCE?)

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
    - Why do we use FOC?
    - How does PWM 'request' a square wave of current?
    - what are the variables that increase parastic resistance and impedance
    - impedance vs inductance?

## 🌓K : CAPACITORS TO MITIGATE EFFECTS OF PWM

- pg 170

## 🌓F : CAPACITORS TO MITIGATE EFFECTS OF PWM

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

## 🌓G : The Downsides of Ground Loops

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

## 🌓C : GENERAL SPACE VECTOR MODEL of BPMS MOTOR (Chapter 3)

- PURPOSE: quick summary of the space vector model for a sinusodial BPMS motor which is used in FOC

## 🌓H : Deep Dive FOC and BLDC Current Control (Chapter 5)

- PURPOSE: The purpose of this is to explain  

- CONTENT
- The ODrive uses FOC control, which uses current control under it.

- QUESTIONS
    - FOC for induction motors vs synchronous motors? FOC for sinusoidal drives vs non-FOC sinusodial commutation? (pg 3)
    - Why does the ODrive S1 switch? FOC?
        - https://www.powerelectronicsnews.com/switching-edge-control-for-emc-power-supply-design-tutorial-section-4-2/

## 🌓I : High vs Low Inductance Motors

- Low Inductance Motors
    - Current Controller ADC Noise -> Torque Ripple and audible noise due to Magnetostriction

- Higher Inductance Motors
    - Current Controller ADC Noise -> Smoothed-out Torque Ripple
    - For high inductance motors (over 300uH), you may need to slow down the current controller bandwidth so it doesn't command impossible currents.
    - Less motor power loss P = I^2R
    - https://tinyurl.com/22tdaaue
    - QUESTION: while the higher impedance motor is loosing less power through the resistor since there is less current flowing through it due to the higher value inductor, isn't the motor also producing much less torque?

## 🌓J : MANAGING EMF

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

## 🌓 : Motor Drivers

## 🌓 : Ground Isolator Chip

## 🌓 : Brake Resistors

## 🌓 : Other

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
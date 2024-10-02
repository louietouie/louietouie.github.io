---
layout: post
title:  "Collapsing the Softmax Derivative to 1"
date:   2024-09-05 03:42:05 -0400
categories: jekyll update
---

<script type="text/javascript" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<link rel="stylesheet" href="/assets/css/styles.css">

## 🌑︎ : Confusion
In Redmon's [Homework 4 instructions][1], he mentions that

> "The gradient of a linear activation is just 1 everywhere. The gradient of our softmax will also be 1 everywhere because we will only use the softmax as our output with a cross-entropy loss function"

This confused me, because I was under the impression that the derivative of the softmax function was not a derivative at all, but a more complicated Jacobian matrix of partial derivatives. **So why in the code can we pretend the softmax derivative is 1?**

## 🌒︎ : Background
Activation functions allow neural networks to [approximate any function][8]. Without them, our neural network would collapse down into a single linear regression model. It would just be a summation of a bunch of regression lines.

The Softmax activation function is often applied to the final layer of multi-class classification neural networks. I know of 3 reasons why.
1. It produces a probability vector: a vector whose entries sum to 1.
2. It is differentiable, and therefore backpropagation is possible. This is not the case for argmax.
3. The softmax activation function is always paired with cross entropy loss. The derivative of cross entropy loss w.r.t the input of each node is easy to compute (*actual - predicted*). (**this is what confused me, and what this blog post explains**)

Unlike other activation functions like RELU, Leaky RELU, Tanh, or Sigmoid, the Softmax activation function is unique because the output of each node is dependent of every node in the layer. For example, say we have a 4-class classification neural network whose final layer has nodes A, B, C and D. During backpropagation, the algorithm needs to know how to change neuron B's logit to get some reduction in the loss function. When neuron B's logit changes, neuron B's output (post softmax function), will also change. However, changing neuron B's logit will also affect neuron A, C, and D's outputs. We need to account for all of these when doing backpropagation.

## 🌓︎ : Resolution
When reading a scientific paper, I learned it's best to [skip to the conclusion on the first pass][7], so I know what I'm working towards. Here's the key points the explanation below will show.

1. As mentioned above, the softmax activation function and cross entropy loss function are always packaged together.
2. When this is the case, the derivative of the loss w.r.t a final layer neuron's output, $$ \frac{dL}{da} $$, and the derivative of the neuron's output w.r.t it's input, $$ \frac{da}{dz} $$, AKA the derivative of the activation function, can be combined.
3. When combining $$ \frac{dL}{da} \frac{da}{dz} $$ into $$ \frac{dL}{dz} $$, the combined derivative simplifies down to *predicted - actual*.
4. Therefore, to simplify things in code, we can calculate the derivative of loss as  *predicted - actual*, and then can just pretend the derivative of the softmax activation is 1, resulting in a combined derivative of *predicted - actual*.

In homework 4, this is exactly what is done. Note that *p* is the model's predictions after one forward pass through, and *b.y* is the true y values. *axpy_matrix(double a, matrix b, matrix c)* just applies the operation *-ab + c*.

```
matrix dL = axpy_matrix(-1, p, b.y);
```

## 🌕︎ : Explanation

#### The Big Picture Explanation

![Softmax Diagram](/assets/images/softmax.svg)

#### The Math

$$
\text{Softmax of Neuron J} =
S_j =
\frac{e^{a_j}}{\sum_{k=1}^n e^{a_k}} =
\frac{e^{\text{neuron j input}}}{\text{sum }e^{\text{neuron input}} \text{ of every final layer neuron}}
$$

$$
\text{Cross Entropy Loss} = H(p,q) = - \sum_{x \in classes} {p(x)log(q(x))}
$$

Unlike other activation functions, to understand how the neurons output changes with with respect to it's input (it's logit), we need to account for not only the current neuron's logit, but every final layer neuron's logit. This is why we end up with a vector of partial derivatives instead of a single derivative, which get combined to form a Jacobian.

Here is a single partial derivative that we want to calculate. It is the partial derivative of Neuron i's output w.r.t Neuron j's input.

$$ D_jS_i = \frac{\delta S_i}{\delta a_j} = \frac{\delta}{\delta a_j} \frac{e^{a_i}}{\sum_{k=1}^n e^{a_k}} $$

We will use the quotient rule.

$$ f(x) = \frac{g(x)}{h(x)} \implies f'(x) = \frac{g'(x)h(x)-h'(x)g(x)}{(h(x))^2} $$

Applying the quotient rule to our partial derivative...

$$
\displaylines{
   g(x) = e^{a_i}
   \\ h(x) = \sum_{k=1}^n e^{a_k} = e^{a_1} + e^{a_2} + ... + e^{a_j}  + ... + e^{a_N}
   \\ g'(x) = \frac{\delta}{\delta a_j} e^{a_i}  =
      \begin{cases}
         0, & \text{if } i \neq j \\
         {e^{a_i} }, & \text{if } i = j
      \end{cases}
   \\ h'(x) = e^{a_j} 
}
$$

Now, we have two cases...
 * $$ i = j $$, AKA we want to see how a node's output changes when we change that node's input.
 * $$ i \neq j $$, AKA we want to see how a node's output changes when we change a different node's input.

To make things simpler, let's let...

 $$ ☆ = \sum_{k=1}^n e^{a_k} = \text{sum of all final layer neuron exponential functions} $$

CASE 1 : $$ i = j $$

$$
\displaylines{
   \frac {g'(x)h(x)-h'(x)g(x)}{(h(x))^2}
   \\ = \frac{0 * ☆-e^{a_j}e^{a_i}}{☆^2}
   \\ = \frac{-e^{a_j}e^{a_i}}{☆^2}
   \\ = -\frac{e^{a_j}}{☆} \frac{e^{a_i}}{☆}
   \\ = -S_jS_i
   = -\text{softmax of node j} * \text{softmax of node i}
}   
$$

CASE 2 : $$ i \neq j $$

$$
\displaylines{
   \frac {g'(x)h(x)-h'(x)g(x)}{(h(x))^2}
   \\ = \frac{e^{a_i} * ☆-e^{a_j}e^{a_i}}{☆^2}
   \\ = \frac{e^{a_i} * ☆}{☆^2} - \frac{e^{a_j}e^{a_i}}{☆^2}
   \\ = \frac{e^{a_i}}{☆} - \frac{e^{a_j}}{☆} \frac{e^{a_i}}{☆}
   \\ = S_i-S_jS_i =
   \\ = S_i(1-S_j)
}
$$

So therefore, we have...

$$
D_jS_i =
\text{how softmax}(a_i) \text{ changes when }a_j \text{ changes} =
\begin{cases}
   -S_jS_i, & \text{if } i \neq j \\
   {S_i(1-S_j) }, & \text{if } i = j
\end{cases}
$$

I like the above notation, but some people like to simplify this by adding in the Kronecker delta.

$$
\displaylines{
   \delta_{ij} =
   \begin{cases}
      0, & \text{if } i \neq j \\
      1, & \text{if } i = j
   \end{cases}
   \implies D_jS_i = S_i(\delta_{ij} - S_j)
}
$$

So now we know how to calculate the partial derivatives of the softmax activation function. This is the same as the <span style="color:purple">**purple derivatives**</span> in the image above. Now, we need to add in the <span style="color:green">**green part**</span>, aka the derivative of loss with respect to these softmax outputs.

$$
\text{Cross Entropy Loss} = H(p,q) = - \sum_{x \in classes} {p(x)log(q(x))}
$$

$$
\displaylines{
   \frac {\delta L}{\delta a_i} =
   \frac {\delta}{\delta a_i}
      \left(\begin{align*}
         - \sum_k {y_k log(p_k)}
      \end{align*}\right) =
   -\sum_k y_k * \frac{1}{p_k} * \frac{\delta}{\delta a_i}p_k

   \\ = -y_i * \frac{1}{p_i} * p_i(1-p_i) - \sum_{k \neq i} y_k \frac{1}{p_k}(-p_kp_i)
   \\ = -y_i * (1-p_i) + \sum_{k \neq i} y_k p_i
   \\ = -y_i + y_i p_i + \sum_{k \neq i} y_k p_i
   \\ = -y_i +  \sum y_k p_i \\= - y_i + p_i
   \\ = p_i - y_i = \textcolor{orange}{\text{predicted - actual}}
}
$$

## 🌖︎ : Lingering Questions
1. Why do we normalize the final layer with softmax, as opposed to other normalization methods? Say $$\frac{\sigma(x_i)}{\sum_k \sigma(x_k)}$$ Maybe just because it makes the derivatives work out so cleanly?
2. It is often said that softmax turns a vector into a [probability distribution][2]. Some models often have to be [calibrated][3], so that their output more accurately reflects the true probability. Is this also the case for neural networks that use the softmax function, or can the final probability vector be treated as true probabilities of each class?
3. When is it safe to skip the softmax activation function, and plug the neurons' logits directly into cross entropy loss using [from_logits][4] in Tensorflow? If from_logits = true, and therefore Tensorflow applies the softmax itself (which seems the exact same as just applying it ourselves first), then why do people [claim][5] that it is more numerically stable? [possible answer][6]

<!-- links -->
[1]: https://github.com/pjreddie/vision-hw4
[2]: https://en.wikipedia.org/wiki/Softmax_function
[3]: https://scikit-learn.org/stable/modules/calibration.html
[4]: https://www.tensorflow.org/api_docs/python/tf/keras/losses/BinaryCrossentropy
[5]: https://datascience.stackexchange.com/questions/73093/what-does-from-logits-true-do-in-sparsecategoricalcrossentropy-loss-function
[6]: https://stackoverflow.com/questions/34907657/scale-the-loss-value-according-to-badness-in-caffe/34917052#34917052
[7]: https://www.cs.cornell.edu/~stanleycelestin/HowtoReadPaper.pdf
[8]: https://en.wikipedia.org/wiki/Universal_approximation_theorem

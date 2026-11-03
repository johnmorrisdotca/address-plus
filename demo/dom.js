// A small element builder the tools share: an element of a tag, its text set as text, never as HTML.

/** An element of `tag` holding `text` (nothing when it is missing), with `className` when given. */
const cell = (tag, text, className) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text ?? "";
  return element;
};

export { cell };

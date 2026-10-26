export function randomColourStyleBuilder(type) {
  // Hex via replacing each '0' of '#000000', per https://stackoverflow.com/a/5092872
  const randomColour = () =>
    '#000000'.replace(/0/g, () => {
      return (~~(Math.random() * 16)).toString(16);
    });
  let style = `background:${randomColour()};`;

  if (type === 'random_gradient') {
    const directions = [
      'to right',
      'to left',
      'to bottom',
      'to top',
      'to bottom right',
      'to bottom left',
      'to top right',
      'to top left',
    ];
    style = `background:linear-gradient(${
      directions[Math.floor(Math.random() * directions.length)]
    }, ${randomColour()}, ${randomColour()});`;
  }

  return {
    type: 'colour',
    style,
  };
}

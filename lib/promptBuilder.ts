export function buildPersonaPrompt(
  archetype: string,
  styleBase: string,
  mood: string
) {
  return `
  ultra realistic professional portrait photography,
  ${styleBase},

  portrait of a ${archetype},

  ${mood} expression,
  natural skin texture,
  subtle facial imperfections,
  real human proportions,
  DSLR camera,
  85mm lens,
  shallow depth of field,
  soft cinematic lighting,
  highly detailed,
  high resolution,
  Instagram profile picture,
  centered composition,
  blurred background,
  no illustration,
  no cartoon,
  no anime,
  no CGI,
  no 3D render
  `;
}

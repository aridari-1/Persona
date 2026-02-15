import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { personaStyles } from "@/lib/personaStyles";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generateIdentity() {
  const genders = ["male", "female"];
  const skinTones = ["light skin", "medium skin", "dark brown skin", "olive skin"];
  const hairStyles = [
    "short curly black hair",
    "long straight brown hair",
    "buzz cut dark hair",
    "wavy blonde hair",
    "medium afro hair",
  ];
  const eyeColors = ["dark brown eyes", "hazel eyes", "green eyes", "blue eyes"];
  const faceShapes = ["oval face", "sharp jawline", "round face", "defined cheekbones"];
  const features = [
    "subtle freckles",
    "small scar on left eyebrow",
    "clean smooth skin",
    "light beard",
    "natural eyebrows",
  ];

  return {
    gender: genders[Math.floor(Math.random() * genders.length)],
    skin_tone: skinTones[Math.floor(Math.random() * skinTones.length)],
    hair: hairStyles[Math.floor(Math.random() * hairStyles.length)],
    eyes: eyeColors[Math.floor(Math.random() * eyeColors.length)],
    face_shape: faceShapes[Math.floor(Math.random() * faceShapes.length)],
    distinctive_feature: features[Math.floor(Math.random() * features.length)],
  };
}

async function buildFaceSignatureFromAvatar(dataUrl: string) {
  // dataUrl: "data:image/png;base64,..."
  const base64 = dataUrl.split(",")[1];
  const inputBuf = Buffer.from(base64, "base64");

  // Crop a centered square (best cheap proxy for face region on portraits)
  // Resize to keep token/cost down when sending to vision model
  const croppedPng = await sharp(inputBuf)
    .resize(768, 768, { fit: "cover" })
    .extract({ left: 128, top: 128, width: 512, height: 512 })
    .png()
    .toBuffer();

  const croppedDataUrl = `data:image/png;base64,${croppedPng.toString("base64")}`;

  // Vision -> stable face geometry description
  // If your account doesn’t have this model, change to another vision model you have access to.
  const visionModel = "gpt-4o-mini";

  const res = await openai.chat.completions.create({
    model: visionModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You extract stable facial-identity descriptors for consistent image generation. Focus on immutable geometry, not scene, lighting, or accessories.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Describe ONLY the person's stable facial identity in 10–16 bullet points. " +
              "Include: face shape proportions, jawline, cheekbones, eye shape/spacing, eyebrow shape, nose bridge/tip, lips, chin, forehead, skin tone, any unique marks. " +
              "Avoid clothing/background/lighting. Avoid subjective words like 'beautiful'.",
          },
          { type: "image_url", image_url: { url: croppedDataUrl } },
        ],
      },
    ],
  });

  const text = res.choices?.[0]?.message?.content?.trim();
  return text && text.length > 20
    ? text
    : "Stable face: same person, same facial bone structure, same eye/nose/lip geometry.";
}

export async function POST(req: Request) {
  try {
    const { archetype, style, mood } = await req.json();

    const selectedStyle = personaStyles.find((s) => s.id === style);
    if (!selectedStyle) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const identity = generateIdentity();

    // LOCKED camera / portrait recipe (we’ll reuse the same recipe later)
    const cameraLock = {
      lens: "85mm",
      aperture: "f/1.8",
      framing: "head-and-shoulders portrait",
      angle: "straight-on",
      expression: "neutral relaxed expression",
      lighting: "soft cinematic key light, gentle fill, natural skin texture",
      background: "simple dark gradient studio background",
    };

    const prompt = `
Ultra realistic professional portrait photography.
${selectedStyle.basePrompt}

HEADSHOT IDENTITY (keep consistent):
- ${identity.gender}
- ${identity.skin_tone}
- ${identity.hair}
- ${identity.eyes}
- ${identity.face_shape}
- ${identity.distinctive_feature}

Camera + pose lock:
- ${cameraLock.framing}
- ${cameraLock.angle}
- ${cameraLock.lens} lens, ${cameraLock.aperture}
- ${cameraLock.expression}
- ${cameraLock.lighting}
- ${cameraLock.background}

Archetype: ${archetype}
Mood: ${mood}

Not cartoon, not illustration. Highly detailed, realistic skin.
`.trim();

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      // optional if supported on your account:
      // quality: "high",
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    const avatarUrl = `data:image/png;base64,${imageBase64}`;

    // Build face signature (best-effort)
    let face_signature = "";
    try {
      face_signature = await buildFaceSignatureFromAvatar(avatarUrl);
    } catch (e) {
      console.error("FACE SIGNATURE ERROR:", e);
      face_signature =
        "Stable face: same person, same facial bone structure, same eye/nose/lip geometry.";
    }

    return NextResponse.json({
      avatar_url: avatarUrl,
      persona_dna: {
        archetype,
        style,
        mood,
        identity,
        camera_lock: cameraLock,
        face_signature,
      },
    });
  } catch (error) {
    console.error("GENERATION ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

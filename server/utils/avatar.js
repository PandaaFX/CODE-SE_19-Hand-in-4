const sharp = require("sharp");

async function isMimeTypeValid(avatarBuffer) {
  try {
    const sharpImageInstance = sharp(avatarBuffer);
    const metadata = await sharpImageInstance.metadata();
    const mimeType = metadata?.type;
    if (
      mimeType === "png" ||
      mimeType === "jpg" ||
      mimeType === "jpeg" ||
      mimeType === "jpe" ||
      mimeType === "pjpeg" ||
      mimeType === "pjp" ||
      mimeType === "jfif" ||
      mimeType === "webp"
    )
      return true;
    return false;
  } catch (error) {
    console.log(
      "An error occurred while reading metadata from avatar. Err:",
      error,
    );
    return false;
  }
}

async function processAvatar(avatarBuffer) {
  const webpBuffer = await sharp(avatarBuffer)
    .resize(256)
    .webp({ quality: 80 })
    .toBuffer();

  return webpBuffer;
}

module.exports = {
  isMimeTypeValid,
  processAvatar,
};

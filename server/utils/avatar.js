const sharp = require("sharp");

function isMimeTypeValid(mimeType) {
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

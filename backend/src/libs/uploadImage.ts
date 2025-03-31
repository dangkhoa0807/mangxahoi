import sharp from "sharp";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import CryptoJS from "crypto-js";
import { fileTypeFromBuffer } from "file-type";

// Khởi tạo client S3
const baseurl = "https://s3.cloudfly.vn/socialnetwork";
const client = new S3Client({
  region: "hcm",
  credentials: {
    accessKeyId: "AO5UJM0W0YZ43PSY9UB6",
    secretAccessKey: "x27SrXwDCKvOPZJ82O3egthQLvWPsdb4erflg4BB",
  },
  endpoint: "https://s3.cloudfly.vn",
});

// Hàm upload ảnh động với chuyển đổi sang WebP
async function uploadAnimatedWebP(fileBuffer: Buffer) {
  try {
    const hash = CryptoJS.MD5(fileBuffer.toString()).toString(CryptoJS.enc.Hex);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Chuyển đổi sang WebP động với chất lượng tốt
    const webpBuffer = await sharp(fileBuffer, { animated: true })
      .webp({
        quality: 80,
        lossless: false,
        effort: 4,
        force: true,
      })
      .toBuffer();

    const filename = `${hash}.webp`;
    const folderPath = `${year}/${month}`;

    const upload = new Upload({
      client,
      params: {
        Bucket: "socialnetwork",
        Key: `${folderPath}/images/${filename}`,
        Body: webpBuffer,
        ContentType: "image/webp",
      },
    });

    await upload.done();
    return `${baseurl}/${folderPath}/images/${filename}`;
  } catch (error) {
    console.error("Lỗi khi xử lý hoặc upload ảnh động:", error);
    throw new Error("Lỗi khi upload ảnh động");
  }
}

async function isAnimatedWebP(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.pages !== undefined && metadata.pages > 1;
  } catch (error) {
    return false;
  }
}

const uploadImage = async (fileBuffer: Buffer) => {
  try {
    // Kiểm tra loại file
    const fileType = await fileTypeFromBuffer(fileBuffer);
    if (!fileType || !fileType.mime.startsWith("image/")) {
      throw new Error("File không phải là ảnh");
    }

    // Kiểm tra nếu là ảnh động (GIF hoặc WebP động)
    if (
      fileType.ext === "gif" ||
      (fileType.ext === "webp" && (await isAnimatedWebP(fileBuffer)))
    ) {
      return await uploadAnimatedWebP(fileBuffer);
    }

    // Xử lý ảnh tĩnh như bình thường
    const hash = CryptoJS.MD5(fileBuffer.toString()).toString(CryptoJS.enc.Hex);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const filename = `${hash}.avif`;
    const folderPath = `${year}/${month}`;

    const avifBuffer = await sharp(fileBuffer).avif({ quality: 70 }).toBuffer();

    const upload = new Upload({
      client,
      params: {
        Bucket: "socialnetwork",
        Key: `${folderPath}/images/${filename}`,
        Body: avifBuffer,
        ContentType: "image/avif",
      },
    });

    await upload.done();

    // Trả về URL của ảnh đã upload
    return `${baseurl}/${folderPath}/images/${filename}`;
  } catch (error) {
    console.error("Lỗi khi xử lý hoặc upload ảnh:", error);
    throw new Error("Lỗi khi upload ảnh");
  }
};

const uploadFile = async (fileBuffer: Buffer, originalFilename: string) => {
  try {
    // Tạo hash từ file để làm tên file
    const hash = CryptoJS.MD5(fileBuffer.toString()).toString(CryptoJS.enc.Hex);

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Lấy phần mở rộng từ tên file gốc
    const extension = originalFilename.split(".").pop() || "";
    const filename = `${hash}.${extension}`;
    const folderPath = `files/${year}/${month}`;

    // Upload lên S3
    const upload = new Upload({
      client,
      params: {
        Bucket: "socialnetwork",
        Key: `${folderPath}/files/${filename}`,
        Body: fileBuffer,
        ContentType: `application/${extension}`,
      },
    });

    await upload.done();

    // Trả về URL của file đã upload
    return `${baseurl}/${folderPath}/files/${filename}`;
  } catch (error) {
    console.error("Lỗi khi upload file:", error);
    throw new Error("Lỗi khi upload file");
  }
};

export { uploadImage, uploadFile, uploadAnimatedWebP };

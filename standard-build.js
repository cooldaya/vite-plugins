import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

/**
 * 将文件夹打包成 ZIP 文件
 * @param {string} sourceDir 要打包的源文件夹
 * @param {string} outputZipPath 输出 ZIP 文件的路径
 * @returns {Promise<void>}
 */
async function zipFolder(sourceDir, outputZipPath) {
  try {
    // 1. 创建输出 ZIP 文件
    const output = fs.createWriteStream(outputZipPath);

    // 2. 创建 archiver 实例
    const archive = archiver("zip", {
      zlib: { level: 9 }, // 设置压缩级别 (可选)
    });

    // 3. 监听 archiver 事件
    output.on("close", () => {
      console.log(
        `ZIP 文件已创建: ${outputZipPath} (${archive.pointer()} bytes)`
      );
    });

    archive.on("error", (err) => {
      throw err;
    });

    // 4. 将文件添加到 archiver
    archive.pipe(output); // 将 archiver 的输出管道到文件流

    // 将文件夹中的所有文件添加到 ZIP 文件
    archive.directory(sourceDir, false); // sourceDir 是要打包的文件夹，false 表示不保留父目录结构

    // 5. 完成 archiver
    await archive.finalize();
  } catch (error) {
    console.error("打包失败:", error);
    throw error;
  }
}

/**
 * 获取当前时间戳
 * @returns {string} 当前时间戳，格式为 YYYYMMDD-HHMMSS
 */
function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始，需要 +1
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}-${hour}${minute}${second}`;
}

/**
 * 设置标准构建名称
 * @param {Object} options - 配置选项
 * @param {string} options.buildDir - 构建目录
 * @param {string} options.zipName - ZIP 文件名
 * @returns {Object} - Vite 插件对象
 */
export default function setStandardBuildName(options = {}) {
  const pluginOptions = {
    buildDir: "build",
    zipName: "",
    ...options,
  };

  return {
    name: "tta-plugin",
    enforce: "pre",
    config(config) {
      // console.log(config);
      return {
        build: {
          outDir: "dist",
        },
      };
    },
    buildEnd() {
      const buildDir = path.join(
        process.cwd(),
        pluginOptions.buildDir || "build"
      );
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, {
          recursive: true,
        });
      }

      const zipName =
        pluginOptions.zipName ||
        (() => {
            console.log('ssaa->',process.cwd())
          const currentFolderName = path.basename(process.cwd());
          const currentTime = getCurrentTimestamp();
          return `${buildDir}/${currentFolderName}-${currentTime}.zip`;
        })();
      zipFolder("dist", zipName).then(() => {
        console.log(`打包完成: ${zipName}`);
      });
    },
  };
}

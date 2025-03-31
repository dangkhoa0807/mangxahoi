import prisma from "@/libs/prisma";
import { deleteCache, deleteCachePattern } from "@/libs/redis";

async function main() {
  // try {
  //   // Delete all caches that match common patterns
  //   await Promise.all([
  //     // Any other caches
  //     deleteCachePattern("*"),
  //   ]);

  //   console.log("Successfully cleared all Redis caches");
  // } catch (error) {
  //   console.error("Error clearing Redis caches:", error);
  // }

  const keyword = "like";

  try {
    const stickers = await prisma.sticker.findMany({
      where: {
        keywords: {
          hasSome: keyword
            .split(" ")
            .filter((k) => k.length > 0)
            .map((k) => k.toLowerCase()),
        },
      },
    });
    console.log(stickers);
  } catch (error) {
    console.error("Error getting stickers:", error);
  }
}

main();

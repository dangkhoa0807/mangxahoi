import prisma from "@/libs/prisma";
import { getCache, setCache } from "@/libs/redis";
import { getUTCTime } from "@/libs/time";
import { startOfWeek } from "date-fns";

const CACHE_TTL = 60 * 60; // 1 giờ

export async function getGenderStatistics() {
  const cacheKey = "statistics:gender";

  // lấy cache nếu có
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const stats = await prisma.profile.groupBy({
    by: ["gender"],
    _count: {
      gender: true,
    },
  });

  const result = {
    labels: ["Nam", "Nữ", "Khác"],
    datasets: [
      {
        data: [
          stats.find((s) => s.gender === "male")?._count.gender || 0,
          stats.find((s) => s.gender === "female")?._count.gender || 0,
          stats.find((s) => s.gender === "other")?._count.gender || 0,
        ],
        backgroundColor: ["#3B82F6", "#EC4899", "#8B5CF6"],
      },
    ],
  };

  // lưu cache
  await setCache(cacheKey, result, CACHE_TTL);

  return result;
}

export async function getAgeStatistics() {
  const cacheKey = "statistics:age";

  // lấy cache nếu có
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const now = new Date();
  const profiles = await prisma.profile.findMany({
    select: {
      birthday: true,
    },
  });

  const ageGroups = {
    "18-24": 0,
    "25-34": 0,
    "35-44": 0,
    "45-54": 0,
    "55+": 0,
  };

  profiles.forEach((profile) => {
    const age = Math.floor(
      (now.getTime() - profile.birthday.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );

    if (age >= 18 && age <= 24) ageGroups["18-24"]++;
    else if (age >= 25 && age <= 34) ageGroups["25-34"]++;
    else if (age >= 35 && age <= 44) ageGroups["35-44"]++;
    else if (age >= 45 && age <= 54) ageGroups["45-54"]++;
    else if (age >= 55) ageGroups["55+"]++;
  });

  const result = {
    labels: ["18-24", "25-34", "35-44", "45-54", "55+"],
    datasets: [
      {
        label: "Người dùng",
        data: [
          ageGroups["18-24"],
          ageGroups["25-34"],
          ageGroups["35-44"],
          ageGroups["45-54"],
          ageGroups["55+"],
        ],
        backgroundColor: "#3B82F6",
      },
    ],
  };

  // lưu cache
  await setCache(cacheKey, result, CACHE_TTL);

  return result;
}

export async function getOverallStatistics() {
  const cacheKey = "statistics:overall";

  // lấy cache nếu có
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  // Lấy số liệu thống kê
  const [userCount, postCount, commentCount, groupCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({
      where: {
        status: "ACTIVE",
      },
    }),
    prisma.comment.count(),
    prisma.group.count(),
  ]);

  const result = {
    users: userCount,
    posts: postCount,
    comments: commentCount,
    groups: groupCount,
  };

  // lưu cache
  await setCache(cacheKey, result, CACHE_TTL);

  return result;
}

export async function getInteractionStatistics() {
  const cacheKey = "statistics:interactions";

  // lấy cache nếu có
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const days = [];

  // lấy dữ liệu cho mỗi ngày trong tuần
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [reactions, comments] = await Promise.all([
      prisma.reaction.count({
        where: {
          createdAt: {
            gte: getUTCTime(date),
            lt: getUTCTime(nextDate),
          },
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: {
            gte: getUTCTime(date),
            lt: getUTCTime(nextDate),
          },
        },
      }),
    ]);

    days.push({
      reactions,
      comments,
    });
  }

  const result = {
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    datasets: [
      {
        label: "Lượt thích",
        data: days.map((day) => day.reactions),
        borderColor: "#3B82F6",
        tension: 0.4,
      },
      {
        label: "Bình luận",
        data: days.map((day) => day.comments),
        borderColor: "#EC4899",
        tension: 0.4,
      },
    ],
  };

  // lưu cache
  await setCache(cacheKey, result, CACHE_TTL);

  return result;
}

export async function getPostTypeStatistics() {
  const cacheKey = "statistics:post_types";

  // lấy cache nếu có
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const [textOnly, withImages] = await Promise.all([
    // Bài viết chỉ có text
    prisma.post.count({
      where: {
        status: "ACTIVE",
        images: { none: {} },
        content: { not: null },
      },
    }),
    // Bài viết có hình ảnh
    prisma.post.count({
      where: {
        status: "ACTIVE",
        images: { some: {} },
      },
    }),
  ]);

  const result = {
    labels: ["Chỉ văn bản", "Có hình ảnh"],
    datasets: [
      {
        data: [textOnly, withImages],
        backgroundColor: ["#F97316", "#06B6D4"],
      },
    ],
  };

  // lưu cache
  await setCache(cacheKey, result, CACHE_TTL);

  return result;
}

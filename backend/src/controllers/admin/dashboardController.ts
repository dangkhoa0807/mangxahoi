import prisma from "@/libs/prisma";
import { Hono } from "hono";
import {
  getAgeStatistics,
  getGenderStatistics,
  getInteractionStatistics,
  getOverallStatistics,
  getPostTypeStatistics,
} from "@/helpers/statistics";

const dashboardController = new Hono();

// Thống kê người dùng theo giới tính
dashboardController.get("/statistics/gender", async (c) => {
  try {
    const genderChartData = await getGenderStatistics();

    return c.json({
      code: 200,
      data: genderChartData,
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy thống kê người dùng theo giới tính",
    });
  }
});

// Thống kê người dùng theo độ tuổi
dashboardController.get("/statistics/age", async (c) => {
  try {
    const ageChartData = await getAgeStatistics();

    return c.json({
      code: 200,
      data: ageChartData,
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy thống kê người dùng theo độ tuổi",
    });
  }
});

// Thống kê tất cả
dashboardController.get("/statistics/all", async (c) => {
  const genderChartData = await getGenderStatistics();
  const ageChartData = await getAgeStatistics();
  const overallChartData = await getOverallStatistics();
  const interactionChartData = await getInteractionStatistics();
  const postTypeChartData = await getPostTypeStatistics();

  return c.json({
    code: 200,
    data: {
      gender: genderChartData,
      age: ageChartData,
      overall: overallChartData,
      interaction: interactionChartData,
      postType: postTypeChartData,
    },
  });
});

export default dashboardController;

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get all groups without status
  const groupsWithoutStatus = await prisma.group.updateMany({
    data: {
      status: "ACTIVE",
    },
  });

  // // Update groups without status to ACTIVE
  // if (groupsWithoutStatus.length > 0) {
  //   await prisma.group.updateMany({
  //     where: {
  //       status: {
  //         not: "ACTIVE",
  //       },
  //     },
  //     data: {
  //       status: "ACTIVE",
  //     },
  //   });
  // }

  console.log(
    `✅ Updated ${groupsWithoutStatus.count} groups with missing status to ACTIVE`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error in seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

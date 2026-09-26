/*
  Warnings:

  - You are about to drop the `ref_block_data_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ref_data_sources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ref_block_data_sources" DROP CONSTRAINT "ref_block_data_sources_data_source_id_fkey";

-- DropTable
DROP TABLE "ref_block_data_sources";

-- DropTable
DROP TABLE "ref_data_sources";

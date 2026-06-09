import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import type { ScrapedReviewItem } from './scraped-review.types';
import {
  getScrapedReviewRating,
  getScrapedReviewText,
} from './scraped-review.util';

type ExcelReviewRow = {
  no: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  likesCount: number;
  ownerReply: string;
};

@Injectable()
export class ScraperWorkbookService {
  private readonly logger = new Logger(ScraperWorkbookService.name);

  async generate(
    reviews: ScrapedReviewItem[],
    jobId: number,
    destinationName: string,
  ) {
    const workbook = this.createWorkbook();
    const sheet = this.createReviewSheet(workbook);
    this.addReviewRows(sheet, reviews);
    this.enableAutoFilter(sheet, reviews.length);

    const filePath = await this.saveWorkbook(
      workbook,
      jobId,
      reviews.length,
      destinationName,
    );
    this.logger.log(`Excel file saved: ${path.basename(filePath)}`);
    return filePath;
  }

  private createWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RanahInsight';
    workbook.created = new Date();
    return workbook;
  }

  private createReviewSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet('Ulasan', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Pengulas', key: 'reviewerName', width: 22 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Teks Ulasan', key: 'reviewText', width: 60 },
      { header: 'Tanggal Ulasan', key: 'reviewDate', width: 18 },
      { header: 'Jumlah Suka', key: 'likesCount', width: 14 },
      { header: 'Balasan Pemilik', key: 'ownerReply', width: 40 },
    ];
    this.styleHeaderRow(sheet.getRow(1));
    return sheet;
  }

  private styleHeaderRow(row: ExcelJS.Row) {
    row.height = 28;
    row.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D82B5' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = this.createThinBorder('FF1A5276');
    });
  }

  private addReviewRows(
    sheet: ExcelJS.Worksheet,
    reviews: ScrapedReviewItem[],
  ) {
    reviews.forEach((item, index) => {
      const review = this.toExcelRow(item, index);
      const row = sheet.addRow(review);
      this.styleReviewRow(row, index, review.rating);
    });
  }

  private toExcelRow(item: ScrapedReviewItem, index: number): ExcelReviewRow {
    return {
      no: index + 1,
      reviewerName: this.getReviewerName(item),
      rating: getScrapedReviewRating(item),
      reviewText: getScrapedReviewText(item),
      reviewDate: this.formatReviewDate(this.getReviewDate(item)),
      likesCount: this.getLikesCount(item),
      ownerReply: this.getOwnerReply(item),
    };
  }

  private getReviewerName(item: ScrapedReviewItem) {
    return item.name ?? item.reviewerName ?? 'Anonymous';
  }

  private getReviewDate(item: ScrapedReviewItem) {
    return item.publishedAtDate ?? item.date;
  }

  private getLikesCount(item: ScrapedReviewItem) {
    return item.likesCount ?? 0;
  }

  private getOwnerReply(item: ScrapedReviewItem) {
    return item.responseFromOwnerText ?? '-';
  }

  private formatReviewDate(reviewDate?: string) {
    if (!reviewDate) return '-';
    return new Date(reviewDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private styleReviewRow(row: ExcelJS.Row, index: number, rating: number) {
    const background = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';

    row.eachCell((cell, columnNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: background },
      };
      cell.border = this.createThinBorder('FFE2E8F0');
      this.alignReviewCell(cell, columnNumber);
      if (columnNumber === 3) this.styleRatingCell(cell, rating);
    });
  }

  private styleRatingCell(cell: ExcelJS.Cell, rating: number) {
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: this.getRatingColor(rating) },
    };
  }

  private alignReviewCell(cell: ExcelJS.Cell, columnNumber: number) {
    const isLongText = columnNumber === 4 || columnNumber === 7;
    cell.alignment = {
      vertical: 'middle',
      horizontal: isLongText ? 'left' : 'center',
      wrapText: true,
    };
  }

  private createThinBorder(argb: string) {
    const color = { argb };
    return {
      top: { style: 'thin' as const, color },
      bottom: { style: 'thin' as const, color },
      left: { style: 'thin' as const, color },
      right: { style: 'thin' as const, color },
    };
  }

  private getRatingColor(rating: number) {
    if (rating >= 4) return 'FF16A34A';
    if (rating >= 3) return 'FFCA8A04';
    return 'FFDC2626';
  }

  private enableAutoFilter(sheet: ExcelJS.Worksheet, reviewCount: number) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: reviewCount + 1, column: 7 },
    };
  }

  private async saveWorkbook(
    workbook: ExcelJS.Workbook,
    jobId: number,
    reviewCount: number,
    destinationName: string,
  ) {
    const uploadDirectory = path.join(process.cwd(), 'uploads', 'scraped_data');
    fs.mkdirSync(uploadDirectory, { recursive: true });

    const filename = this.buildFilename(destinationName, reviewCount);
    const filePath = path.join(uploadDirectory, filename);
    await workbook.xlsx.writeFile(filePath);
    this.copyForJobDownload(filePath, uploadDirectory, jobId);
    return filePath;
  }

  private buildFilename(destinationName: string, reviewCount: number) {
    const sanitizedName = destinationName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);
    const safeName = sanitizedName || 'Destination';
    const date = new Date()
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-');

    return `[RanahInsight]_Scrape_${safeName}_${reviewCount}_Reviews_${date}.xlsx`;
  }

  private copyForJobDownload(
    sourcePath: string,
    uploadDirectory: string,
    jobId: number,
  ) {
    const safeJobId = Number.isSafeInteger(jobId) && jobId > 0 ? jobId : 0;
    const jobFilePath = path.join(uploadDirectory, `job_${safeJobId}.xlsx`);
    if (fs.existsSync(jobFilePath)) fs.unlinkSync(jobFilePath);
    fs.copyFileSync(sourcePath, jobFilePath);
  }
}

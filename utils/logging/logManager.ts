import { StoreCreationLogger, StoreCreationLog } from './storeCreationLogger';
import { StoreReportGenerator, StoreReportData } from '../reports/storeReportGenerator';
import { uploadLogTextToStorage, uploadReportCsvToStorage } from '@/services/logging/logsStorage';

export class LogManager {
  private static logs: Map<string, StoreCreationLog> = new Map();
  private static reports: Map<string, StoreReportData> = new Map();

  static createLogger(storeCode: string, storeName: string): StoreCreationLogger {
    return new StoreCreationLogger(storeCode, storeName);
  }

  static createReportGenerator(storeCode: string, storeName: string): StoreReportGenerator {
    return new StoreReportGenerator(storeCode, storeName);
  }

  static saveLog(storeCode: string, log: StoreCreationLog): void {
    this.logs.set(storeCode, log);
  }

  static saveReport(storeCode: string, report: StoreReportData): void {
    this.reports.set(storeCode, report);
  }

  static getLog(storeCode: string): StoreCreationLog | undefined {
    return this.logs.get(storeCode);
  }

  static getReport(storeCode: string): StoreReportData | undefined {
    return this.reports.get(storeCode);
  }

  static getAllLogs(): StoreCreationLog[] {
    return Array.from(this.logs.values());
  }

  static getAllReports(): StoreReportData[] {
    return Array.from(this.reports.values());
  }
  


  // Generate downloadable content
  static generateLogFile(storeCode: string): string | null {
    const log = this.getLog(storeCode);
    if (!log) return null;

    const logger = new StoreCreationLogger(log.storeCode, log.storeName);
    // Restore the log state
    Object.assign(logger['log'], log);
    
    return logger.generateHumanReadableLog();
  }

  static generateReportCSV(storeCode: string): string | null {
    const report = this.getReport(storeCode);
    if (!report) return null;

    const generator = new StoreReportGenerator(report.storeCode, report.storeName);
    // Restore the report state
    Object.assign(generator['reportData'], report);
    
    return generator.generateCSV();
  }

  // Helper function to trigger downloads in browser
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static downloadLogFile(storeCode: string): boolean {
    const logContent = this.generateLogFile(storeCode);
    if (!logContent) return false;

    const filename = `store-creation-log-${storeCode}-${new Date().toISOString().split('T')[0]}.txt`;
    this.downloadFile(logContent, filename);
    return true;
  }

  static downloadReportCSV(storeCode: string): boolean {
    const csvContent = this.generateReportCSV(storeCode);
    if (!csvContent) return false;

    const filename = `store-report-${storeCode}-${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csvContent, filename, 'text/csv');
    return true;
  }

  static async uploadArtifactsToSupabaseStorage(storeCode: string) {
    const log = this.getLog(storeCode);
    const report = this.getReport(storeCode);

    const file_paths = [];

    if (!log && !report) return;

    // Rehydrate to render
    if (log) {
      const logger = new StoreCreationLogger(log.storeCode, log.storeName);
      logger["log"] = log;
      const logText = logger.generateHumanReadableLog();
      const log_file_path = await uploadLogTextToStorage(storeCode, logText);
      file_paths.push(log_file_path.path? log_file_path.path : '');
    }

    if (report) {
      const gen = new StoreReportGenerator(report.storeCode, report.storeName);
      gen["reportData"] = report;
      const csv = gen.generateCSV();
      const report_file_path = await uploadReportCsvToStorage(storeCode, csv);
      file_paths.push(report_file_path.path? report_file_path.path : '');
    }

    return file_paths;
  }
}
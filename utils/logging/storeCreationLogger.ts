export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
}

export interface StoreCreationLog {
  storeCode: string;
  storeName: string;
  startTime: string;
  endTime?: string;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  entries: LogEntry[];
  summary?: {
    totalProducts: number;
    totalCategories: number;
    successfulProducts: number;
    failedProducts: number;
  };
}

export class StoreCreationLogger {
  private log: StoreCreationLog;

  constructor(storeCode: string, storeName: string) {
    this.log = {
      storeCode,
      storeName,
      startTime: new Date().toISOString(),
      status: 'IN_PROGRESS',
      entries: []
    };
  }

  addEntry(level: LogEntry['level'], message: string, details?: any) {
    this.log.entries.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    });
  }

  logStoreCreationStart(store: any, designId: string, categories: string[]) {
    this.addEntry('INFO', `Starting store creation process for ${store.store_name} (${store.store_code})`, {
      designId,
      categories,
      startDate: store.start_date,
      endDate: store.end_date,
      accountManager: store.account_manager
    });
  }

  logCategoryCreation(categoryId: number, subcategories: string[]) {
    this.addEntry('SUCCESS', `Main store category created successfully`, {
      categoryId,
      subcategories: subcategories.length
    });
  }

  logProductFetch(storeCode: string, productCount: number) {
    this.addEntry('INFO', `Retrieved ${productCount} product configurations for store ${storeCode}`, {
      productCount
    });
  }

  logProductProcessing(productName: string, sageCodes: { old: string, new: string }, namingMethod: string) {
    this.addEntry('INFO', `Processing product: ${productName}`, {
      originalSageCode: sageCodes.old,
      newSageCode: sageCodes.new,
      namingMethod
    });
  }

  logProductSuccess(productName: string, finalName: string, sageCode: string) {
    this.addEntry('SUCCESS', `Product created successfully: ${finalName}`, {
      originalName: productName,
      finalName,
      sageCode
    });
  }

  logProductError(productName: string, error: string, attempts: number) {
    this.addEntry('ERROR', `Failed to create product: ${productName} after ${attempts} attempts`, {
      error,
      attempts
    });
  }

  logBatchProcessing(batchNumber: number, productCount: number) {
    this.addEntry('INFO', `Processing batch ${batchNumber} with ${productCount} products`);
  }

  logStoreStatusUpdate(status: string) {
    this.addEntry('SUCCESS', `Store status updated to: ${status}`);
  }

  completeWithSuccess(summary: StoreCreationLog['summary']) {
    this.log.status = 'SUCCESS';
    this.log.endTime = new Date().toISOString();
    this.log.summary = summary;
    this.addEntry('SUCCESS', 'Store creation completed successfully', summary);
  }

  completeWithError(error: string) {
    this.log.status = 'FAILED';
    this.log.endTime = new Date().toISOString();
    this.addEntry('ERROR', `Store creation failed: ${error}`);
  }

  getLog(): StoreCreationLog {
    return this.log;
  }

  generateHumanReadableLog(): string {
    const duration = this.log.endTime 
      ? Math.round((new Date(this.log.endTime).getTime() - new Date(this.log.startTime).getTime()) / 1000)
      : 0;

    let report = `
STORE CREATION LOG REPORT
========================

Store Information:
- Store Name: ${this.log.storeName}
- Store Code: ${this.log.storeCode}
- Start Time: ${new Date(this.log.startTime).toLocaleString()}
- End Time: ${this.log.endTime ? new Date(this.log.endTime).toLocaleString() : 'In Progress'}
- Duration: ${duration > 0 ? `${duration} seconds` : 'N/A'}
- Status: ${this.log.status}

${this.log.summary ? `
Summary:
- Total Products: ${this.log.summary.totalProducts}
- Successful Products: ${this.log.summary.successfulProducts}
- Failed Products: ${this.log.summary.failedProducts}
- Categories Created: ${this.log.summary.totalCategories}
- Success Rate: ${this.log.summary.totalProducts > 0 ? Math.round((this.log.summary.successfulProducts / this.log.summary.totalProducts) * 100) : 0}%
` : ''}

Process Log:
============
`;

    this.log.entries.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      report += `${index + 1}. [${time}] ${entry.level}: ${entry.message}\n`;
      
      if (entry.details) {
        const details = typeof entry.details === 'object' 
          ? Object.entries(entry.details).map(([key, value]) => `   ${key}: ${value}`).join('\n')
          : `   ${entry.details}`;
        report += `${details}\n`;
      }
      report += '\n';
    });

    report += `
Report Generated: ${new Date().toLocaleString()}
=====================================
`;

    return report;
  }
}
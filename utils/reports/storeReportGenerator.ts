import { productConfig, ProductCreationProps} from "@/types/products";

export interface StoreReportProduct {
  sageCode: string;
  productName: string;
  category: string;
  colour: string;
  sizes: string;
  price: string;
  upcharge: string;
  updatePrice: string;
}

export interface StoreReportData {
  storeCode: string;
  storeName: string;
  generatedDate: string;
  productsByDesign: Record<string, StoreReportProduct[]>;
}

export class StoreReportGenerator {
  private reportData: StoreReportData;

  constructor(storeCode: string, storeName: string) {
    this.reportData = {
      storeCode,
      storeName,
      generatedDate: new Date().toISOString(),
      productsByDesign: {}
    };
  }

  addProduct(
    designId: string,
    sageCode: string,
    productName: string,
    category: string,
    colour: string,
    sizes: string,
    price: number = 10.0
  ) {
    if (!this.reportData.productsByDesign[designId]) {
      this.reportData.productsByDesign[designId] = [];
    }
    this.reportData.productsByDesign[designId].push({
      sageCode,
      productName,
      category,
      colour,
      sizes,
      price: `$${price.toFixed(2)}`,
      upcharge: '$0.00',
      updatePrice: `$${price.toFixed(2)}`
    });
  }

  getReportData(): StoreReportData {
    return this.reportData;
  }

  generateCSV(): string {
    const headers = [
      'Design ID',
      'Sage Code',
      'Product Name/Description/URL',
      'Category',
      'Colour',
      'Sizes',
      'Price',
      'Upcharge/Discount',
      'Update Price/Recommendations'
    ];

    let csv = headers.join(',') + '\n';

    Object.entries(this.reportData.productsByDesign).forEach(([designId, products]) => {
      products.forEach(product => {
        const row = [
          designId,
          product.sageCode,
          `"${product.productName}"`,
          product.category,
          product.colour,
          product.sizes,
          product.price,
          product.upcharge,
          product.updatePrice
        ];
        csv += row.join(',') + '\n';
      });
    });

    return csv;
  }

  generateTableHTML(): string {
    let html = `
    <div class="store-report-table">
      <div class="report-header">
        <h2>Store Report: ${this.reportData.storeName}</h2>
        <p>Store Code: ${this.reportData.storeCode}</p>
        <p>Generated: ${new Date(this.reportData.generatedDate).toLocaleString()}</p>
      </div>
    `;

    Object.entries(this.reportData.productsByDesign).forEach(([designId, products]) => {
      html += `
      <div class="design-section">
        <h3>Design ID: ${designId}</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Sage Code</th>
              <th>Product Name/Description/URL</th>
              <th>Category</th>
              <th>Colour</th>
              <th>Sizes</th>
              <th>Price</th>
              <th>Upcharge/Discount</th>
              <th>Update Price/Recommendations</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${product.sageCode}</td>
                <td>${product.productName}</td>
                <td>${product.category}</td>
                <td>${product.colour}</td>
                <td>${product.sizes}</td>
                <td>${product.price}</td>
                <td>${product.upcharge}</td>
                <td>${product.updatePrice}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  private extractColorFromName(productName: string): string {
    const color = productName.split('-')[1]?.trim();
    
    if (productName.split('-').length != 2 || !color) {
      return 'N/A';
    }
    
    return color;
  }

  // Accepts products grouped by designId
  processProductData(productsByDesign: Record<string, productConfig[]>) {
    Object.entries(productsByDesign).forEach(([designId, products]) => {
      products.forEach(_product => {
        const product: ProductCreationProps = _product.productConfigs as ProductCreationProps;
        const category = _product.category || 'Uncategorized';
        const color = this.extractColorFromName(product.name || '');
        const sizes = product.variants?.map((variant) => variant.option_values?.[0].label || 'N/A') || null;

        this.addProduct(
          designId,
          product.sku || 'N/A',
          product.name || 'N/A',
          category || 'N/A',
          color,
          sizes? sizes.join(', ') : 'N/A',
          product.price || 10.0
        );
      });
    });
  }
}


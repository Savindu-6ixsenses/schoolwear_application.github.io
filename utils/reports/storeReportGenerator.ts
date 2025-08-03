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
  products: StoreReportProduct[];
}

export class StoreReportGenerator {
  private reportData: StoreReportData;

  constructor(storeCode: string, storeName: string) {
    this.reportData = {
      storeCode,
      storeName,
      generatedDate: new Date().toISOString(),
      products: []
    };
  }

  addProduct(
    sageCode: string,
    productName: string,
    category: string,
    colour: string,
    sizes: string,
    price: number = 10.0
  ) {
    this.reportData.products.push({
      sageCode,
      productName,
      category,
      colour,
      sizes,
      price: `$${price.toFixed(2)}`,
      upcharge: '$0.00', // Default upcharge
      updatePrice: `$${price.toFixed(2)}` // Same as price initially
    });
  }

  getReportData(): StoreReportData {
    return this.reportData;
  }

  generateCSV(): string {
    const headers = [
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
    
    this.reportData.products.forEach(product => {
      const row = [
        product.sageCode,
        `"${product.productName}"`, // Wrap in quotes for CSV safety
        product.category,
        product.colour,
        product.sizes,
        product.price,
        product.upcharge,
        product.updatePrice
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  generateTableHTML(): string {
    const tableHTML = `
    <div class="store-report-table">
      <div class="report-header">
        <h2>Store Report: ${this.reportData.storeName}</h2>
        <p>Store Code: ${this.reportData.storeCode}</p>
        <p>Generated: ${new Date(this.reportData.generatedDate).toLocaleString()}</p>
      </div>
      
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
          ${this.reportData.products.map(product => `
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
    
    return tableHTML;
  }

  // Extract color from product name (basic implementation)
  private extractColorFromName(productName: string): string {
    const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray', 'Grey'];
    const foundColor = colors.find(color => 
      productName.toLowerCase().includes(color.toLowerCase())
    );
    return foundColor || 'N/A';
  }

  // Process product data from your existing structure
  processProductData(products: any[], storeCode: string) {
    products.forEach(product => {
      const color = this.extractColorFromName(product.productName || '');
      const sizes = product.sizeVariations || 'N/A';
      
      this.addProduct(
        product.newSageCode || product.sageCode || 'N/A',
        product.finalProductName || product.productName || 'N/A',
        product.category || 'N/A',
        color,
        sizes,
        product.price || 10.0
      );
    });
  }
}
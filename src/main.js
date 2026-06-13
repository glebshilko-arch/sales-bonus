function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   const discountFactor = 1 - (discount / 100);
   const result = sale_price * quantity * discountFactor;
   
   return +result.toFixed(2);
}

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    let bonus = 0;

    if (index === 0) {
        bonus = profit * 0.15;
    } else if (index === total - 1 && total > 1) { 
        bonus = 0;
    } else if (index === 1 || index === 2) {
        bonus = profit * 0.1;
    } else {
        bonus = profit * 0.05;
    }

    if (seller) {
        seller.bonus = +bonus.toFixed(2);
    }
    return +bonus.toFixed(2);
}

function analyzeSalesData(data, options) {
    if (typeof data !== 'object' 
        || data === null 
        || !data.sellers 
        || !data.products
        || !data.purchase_records) {
        throw new Error('analyzeSalesData - (Параметр data — некорректные данные)');
    }

    if (data.sellers.length === 0) {
        throw new Error('analyzeSalesData - (Массив sellers пуст)');
    }
    if (data.products.length === 0) {
        throw new Error('analyzeSalesData - (Массив products пуст)');
    }
    if (data.purchase_records.length === 0) {
        throw new Error('analyzeSalesData - (Массив purchase_records пуст)');
    }

    if (typeof options !== 'object' || options === null) {
        throw new Error('analyzeSalesData -(Параметр options не объект или ноль)');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
         throw new Error('analyzeSalesData -(не заданы функции calculateRevenue calculateBonus параметра options)');
    }

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('analyzeSalesData -(Функции calculateRevenue и calculateBonus параметра options не соответствуют типу данных function)');
    }
        
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        cost: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0
    })); 

    const sellerIndex = sellerStats.reduce((result, seller) => ({
        ...result,
        [seller.id]: seller
    }), {});

    const productIndex = data.products.reduce((result, product) => ({
        ...result,
        [product.sku]: product
    }), {});

    data.purchase_records.forEach(record => {  
        const seller = sellerIndex[record.seller_id];
        if (!seller) return; 
        seller.sales_count += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku]; 
            if (!product) return; 
            
            const itemRevenue = calculateRevenue(item, product);
            seller.revenue = +(seller.revenue + itemRevenue).toFixed(2);
            
            const itemCost = product.purchase_price * item.quantity;
            seller.cost += itemCost;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    }); 

    sellerStats.forEach(seller => {
        seller.profit = +(seller.revenue - seller.cost).toFixed(4);
    });

    sellerStats.sort((a, b) => b.profit - a.profit); 

    const total = sellerStats.length;

    sellerStats.forEach((seller, index) => {
        calculateBonus(index, total, seller);

        seller.top_products = Object.entries(seller.products_sold || {})
            .map(([sku, quantity]) => ({
                sku,
                quantity
            }))
            .sort((a, b) => b.quantity - a.quantity) 
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: seller.revenue, // Выручка уже идеально круглая
        profit: Math.round(seller.profit * 100) / 100, // Надежное финансовое округление
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus
    })); 
}
function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   const discountFactor = 1 - (discount / 100);
   const result = sale_price * quantity * discountFactor;
   return result
}

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    let bonus = 0;

    if (index === 0) {
        bonus = profit * 0.15;
    } else if (index === 1 || index === 2) {
        bonus = profit * 0.1;
    } else if (index === total - 1) {
        bonus = 0;
    } else {
        bonus = profit * 0.05;
    }

    seller.bonus = bonus; 
    return bonus;
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
        throw new Error('analyzeSalesData -(Параметр options не обьект или ноль)')
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
         throw new Error('analyzeSalesData -(не заданны функции calculateRevenue calculateBonus параметра options)')
    }

    if (
    typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('analyzeSalesData -(Функции calculateRevenue и calculateBonus параметра options не соответсвует типу данных function)');
    }
        

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
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
        seller.sales_count += 1;;

        record.items.forEach(item => {
            const product = productIndex[item.sku]; 
             if (!product) return; 
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            seller.revenue += revenue;
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    }); 
    sellerStats.sort((a, b) => b.profit - a.profit); 

    sellerStats.forEach((seller, index) => {
        const total = sellerStats.length;
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
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
})); 
}

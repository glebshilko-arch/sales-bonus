function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   const discountFactor = 1 - (discount / 100);
   const result = sale_price * quantity * discountFactor;
   return result
}

function calculateBonusByProfit(index, total, seller) {
    
    const { profit } = seller;

    if (index === 0) {
        seller.bonus = profit * 0.15;
    } else if (index === 1 || index === 2) {
        seller.bonus = profit * 0.1;
    } else if (index === total - 1) {
        seller.bonus = 0;
    } else {
        seller.bonus = profit * 0.05;
    }

    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({
            sku,
            quantity
        }))
        .sort((a, b) => b.quantity - a.quantity) // сортировка по убыванию
        .slice(0, 10);
}

function analyzeSalesData(data, options) {

     if (typeof data !== 'object' 
    || data === null 
    || !data.sellers 
    || !data.purchase_records) {
  throw new Error('analyzeSalesData - (Параметр data — некорректные данные)');
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
        products_sold: {}
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
        seller.sales_count += 1;;

        record.items.forEach(item => {
            const product = productIndex[item.sku]; 
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item);
            seller.revenue += revenue;
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    }); 
    const sellerStatsDecrease = [...sellerStats].sort((a, b) => b.profit - a.profit); 

    sellerStatsDecrease.forEach((seller, index) => {
        const total = sellerStats.length;
        calculateBonusByProfit(index, total, seller);
    });
    return sellerStatsDecrease.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
})); 
}

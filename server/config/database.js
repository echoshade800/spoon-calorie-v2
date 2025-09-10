import mysql from 'mysql2/promise';

// 使用本地数据库配置，避免远程连接超时
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "quickkcal_local",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  acquireTimeout: 10000,
  timeout: 10000,
  reconnect: true
};

// 创建连接池
let pool = null;
let isConnected = false;

// 尝试创建连接池
try {
  pool = mysql.createPool(dbConfig);
} catch (error) {
  console.error('创建数据库连接池失败:', error);
}

// 测试连接
export const testConnection = async () => {
  try {
    if (!pool) {
      console.log('数据库连接池未初始化，跳过连接测试');
      isConnected = false;
      return false;
    }
    
    const connection = await pool.getConnection();
    console.log('MySQL 数据库连接成功');
    isConnected = true;
    connection.release();
    return true;
  } catch (error) {
    console.warn('MySQL 数据库连接失败，将使用模拟数据:', error.message);
    isConnected = false;
    return false;
  }
};

// 执行查询
export const executeQuery = async (sql, params = []) => {
  try {
    // 如果数据库未连接，返回模拟数据
    if (!pool || !isConnected) {
      console.log('数据库未连接，返回模拟数据');
      return getMockData(sql);
    }
    
    // 如果没有参数，使用 query 方法；如果有参数，使用 execute 方法
    if (params.length === 0) {
      const [rows] = await pool.query(sql);
      return rows;
    } else {
      const [rows] = await pool.execute(sql, params);
      return rows;
    }
  } catch (error) {
    console.warn('SQL 查询执行失败，返回模拟数据:', error.message);
    return getMockData(sql);
  }
};

// 执行事务
export const executeTransaction = async (queries) => {
  if (!pool || !isConnected) {
    console.log('数据库未连接，跳过事务执行');
    return [];
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 模拟数据函数
const getMockData = (sql) => {
  console.log('使用模拟数据响应 SQL:', sql.substring(0, 50) + '...');
  
  // 根据 SQL 类型返回不同的模拟数据
  if (sql.includes('SELECT') && sql.includes('foods')) {
    // 返回模拟食物数据
    return [
      {
        id: 'mock_1',
        name: 'Apple',
        brand: null,
        kcal_per_100g: 52,
        carbs_per_100g: 14,
        protein_per_100g: 0.3,
        fat_per_100g: 0.2,
        serving_label: '1 medium',
        grams_per_serving: 182,
        source: 'USDA',
        category: 'Fruits'
      },
      {
        id: 'mock_2',
        name: 'Banana',
        brand: null,
        kcal_per_100g: 89,
        carbs_per_100g: 23,
        protein_per_100g: 1.1,
        fat_per_100g: 0.3,
        serving_label: '1 medium',
        grams_per_serving: 118,
        source: 'USDA',
        category: 'Fruits'
      },
      {
        id: 'mock_3',
        name: 'Chicken Breast',
        brand: null,
        kcal_per_100g: 165,
        carbs_per_100g: 0,
        protein_per_100g: 31,
        fat_per_100g: 3.6,
        serving_label: '1 breast',
        grams_per_serving: 172,
        source: 'USDA',
        category: 'Poultry'
      }
    ];
  }
  
  if (sql.includes('INSERT')) {
    // 模拟插入成功
    return { insertId: Date.now(), affectedRows: 1 };
  }
  
  if (sql.includes('DELETE')) {
    // 模拟删除成功
    return { affectedRows: 1 };
  }
  
  // 默认返回空数组
  return [];
};
export default pool;
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ResearchFeature } from '@/lib/data/models';

const dataFilePath = path.join(process.cwd(), 'data', 'researchFeatures.json');

// 确保数据文件存在
const ensureDataFile = () => {
  try {
    const dirPath = path.dirname(dataFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify({ researchFeatures: [] }));
    }
  } catch (error) {
    console.error('确保数据文件存在时出错:', error);
  }
};

// 读取所有研究特色
const readResearchFeatures = (): ResearchFeature[] => {
  ensureDataFile();
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data).researchFeatures;
  } catch (error) {
    console.error('读取研究特色数据出错:', error);
    return [];
  }
};

// 保存研究特色数据
const saveResearchFeatures = (researchFeatures: ResearchFeature[]) => {
  ensureDataFile();
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify({ researchFeatures }, null, 2));
  } catch (error) {
    console.error('保存研究特色数据出错:', error);
  }
};

// 获取所有研究特色
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const url = new URL(request.url);
    const active = url.searchParams.get('active');
    const limit = url.searchParams.get('limit');
    
    // 读取数据
    let researchFeatures = readResearchFeatures();
    
    // 如果指定了筛选活跃状态
    if (active === 'true') {
      researchFeatures = researchFeatures.filter(feature => feature.isActive);
    }
    
    // 按顺序排序
    researchFeatures = researchFeatures.sort((a, b) => a.order - b.order);
    
    // 如果指定了限制数量
    if (limit) {
      researchFeatures = researchFeatures.slice(0, parseInt(limit, 10));
    }
    
    return NextResponse.json({ researchFeatures }, { status: 200 });
  } catch (error) {
    console.error('获取研究特色时出错:', error);
    return NextResponse.json(
      { error: '获取研究特色失败' },
      { status: 500 }
    );
  }
}

// 创建新研究特色
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    
    // 基本验证
    if (!data.title || !data.description) {
      return NextResponse.json(
        { error: '标题和描述为必填项' },
        { status: 400 }
      );
    }
    
    // 读取现有数据
    const researchFeatures = readResearchFeatures();
    
    // 创建新记录
    const newId = researchFeatures.length > 0 
      ? Math.max(...researchFeatures.map(feature => feature.id)) + 1 
      : 1;
      
    // 处理顺序字段，确保顺序不为0或负数
    let orderValue = data.order;
    if (!orderValue || orderValue <= 0) {
      // 如果未提供order或order不合法，则使用当前最大order + 1
      orderValue = researchFeatures.length > 0
        ? Math.max(...researchFeatures.map(feature => feature.order || 0)) + 1
        : 1;
    }
    
    const newResearchFeature: ResearchFeature = {
      id: newId,
      title: data.title,
      description: data.description,
      order: orderValue,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加新记录并保存
    researchFeatures.push(newResearchFeature);
    saveResearchFeatures(researchFeatures);
    
    return NextResponse.json({ researchFeature: newResearchFeature }, { status: 201 });
  } catch (error) {
    console.error('创建研究特色时出错:', error);
    return NextResponse.json(
      { error: '创建研究特色失败' },
      { status: 500 }
    );
  }
} 
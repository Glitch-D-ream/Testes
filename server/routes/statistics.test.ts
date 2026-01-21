import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import { statisticsRouter } from './statistics';

let app: Express;
let server: any;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/statistics', statisticsRouter);
  
  server = app.listen(3001, () => {
    console.log('Test server running on port 3001');
  });
});

afterAll(() => {
  server.close();
});

describe('Statistics API Endpoints', () => {
  describe('GET /api/statistics', () => {
    it('should return general statistics', async () => {
      const response = await fetch('http://localhost:3001/api/statistics');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('totalAnalyses');
      expect(data).toHaveProperty('totalPromises');
      expect(data).toHaveProperty('averageConfidence');
      expect(data).toHaveProperty('complianceRate');
      expect(data).toHaveProperty('byCategory');
      expect(data).toHaveProperty('trends');
      expect(data).toHaveProperty('lastUpdated');
    });

    it('should return valid statistics structure', async () => {
      const response = await fetch('http://localhost:3001/api/statistics');
      const data = await response.json();

      // Validate types
      expect(typeof data.totalAnalyses).toBe('number');
      expect(typeof data.totalPromises).toBe('number');
      expect(typeof data.averageConfidence).toBe('number');
      expect(typeof data.complianceRate).toBe('number');
      expect(Array.isArray(data.byCategory)).toBe(true);
      expect(Array.isArray(data.trends)).toBe(true);
    });

    it('should return positive statistics values', async () => {
      const response = await fetch('http://localhost:3001/api/statistics');
      const data = await response.json();

      expect(data.totalAnalyses).toBeGreaterThan(0);
      expect(data.totalPromises).toBeGreaterThan(0);
      expect(data.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(data.averageConfidence).toBeLessThanOrEqual(100);
      expect(data.complianceRate).toBeGreaterThanOrEqual(0);
      expect(data.complianceRate).toBeLessThanOrEqual(100);
    });

    it('should return categories with valid structure', async () => {
      const response = await fetch('http://localhost:3001/api/statistics');
      const data = await response.json();

      expect(data.byCategory.length).toBeGreaterThan(0);
      data.byCategory.forEach((category: any) => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('fulfilled');
        expect(category).toHaveProperty('pending');
        expect(category).toHaveProperty('failed');
        expect(typeof category.category).toBe('string');
        expect(typeof category.count).toBe('number');
      });
    });

    it('should return trends with valid dates', async () => {
      const response = await fetch('http://localhost:3001/api/statistics');
      const data = await response.json();

      expect(data.trends.length).toBeGreaterThan(0);
      data.trends.forEach((trend: any) => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('fulfilled');
        expect(trend).toHaveProperty('pending');
        expect(trend).toHaveProperty('failed');
        expect(trend).toHaveProperty('complianceRate');
      });
    });
  });

  describe('GET /api/statistics/category/:category', () => {
    it('should return category statistics', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/category/Educação');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('fulfilled');
      expect(data).toHaveProperty('pending');
      expect(data).toHaveProperty('failed');
      expect(data).toHaveProperty('complianceRate');
      expect(data).toHaveProperty('topAuthors');
      expect(data).toHaveProperty('monthlyTrend');
    });

    it('should return correct category name', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/category/Educação');
      const data = await response.json();

      expect(data.category).toBe('Educação');
    });

    it('should return top authors array', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/category/Educação');
      const data = await response.json();

      expect(Array.isArray(data.topAuthors)).toBe(true);
      expect(data.topAuthors.length).toBeGreaterThan(0);
      data.topAuthors.forEach((author: any) => {
        expect(author).toHaveProperty('name');
        expect(author).toHaveProperty('promises');
        expect(author).toHaveProperty('fulfilled');
        expect(author).toHaveProperty('rate');
      });
    });

    it('should return monthly trend data', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/category/Educação');
      const data = await response.json();

      expect(Array.isArray(data.monthlyTrend)).toBe(true);
      expect(data.monthlyTrend.length).toBeGreaterThan(0);
      data.monthlyTrend.forEach((month: any) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('count');
        expect(month).toHaveProperty('fulfilled');
      });
    });
  });

  describe('GET /api/statistics/author/:authorId', () => {
    it('should return author statistics', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/author/author-123');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('authorId');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('totalPromises');
      expect(data).toHaveProperty('fulfilled');
      expect(data).toHaveProperty('pending');
      expect(data).toHaveProperty('failed');
      expect(data).toHaveProperty('complianceRate');
      expect(data).toHaveProperty('averageConfidence');
      expect(data).toHaveProperty('byCategory');
      expect(data).toHaveProperty('historicalTrend');
    });

    it('should return correct author ID', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/author/author-456');
      const data = await response.json();

      expect(data.authorId).toBe('author-456');
    });

    it('should return compliance rate between 0 and 100', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/author/author-123');
      const data = await response.json();

      expect(data.complianceRate).toBeGreaterThanOrEqual(0);
      expect(data.complianceRate).toBeLessThanOrEqual(100);
      expect(data.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(data.averageConfidence).toBeLessThanOrEqual(100);
    });

    it('should return categories breakdown', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/author/author-123');
      const data = await response.json();

      expect(Array.isArray(data.byCategory)).toBe(true);
      data.byCategory.forEach((cat: any) => {
        expect(cat).toHaveProperty('category');
        expect(cat).toHaveProperty('count');
        expect(cat).toHaveProperty('fulfilled');
      });
    });

    it('should return historical trend by year', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/author/author-123');
      const data = await response.json();

      expect(Array.isArray(data.historicalTrend)).toBe(true);
      data.historicalTrend.forEach((year: any) => {
        expect(year).toHaveProperty('year');
        expect(year).toHaveProperty('promises');
        expect(year).toHaveProperty('fulfilled');
        expect(year).toHaveProperty('rate');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await fetch('http://localhost:3001/api/statistics/invalid');
      // Should still return 200 or handle gracefully
      expect(response.status).toBeLessThan(500);
    });

    it('should return consistent data structure', async () => {
      const response1 = await fetch('http://localhost:3001/api/statistics');
      const response2 = await fetch('http://localhost:3001/api/statistics');
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
    });
  });

  describe('Performance', () => {
    it('should return statistics within reasonable time', async () => {
      const start = Date.now();
      await fetch('http://localhost:3001/api/statistics');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch('http://localhost:3001/api/statistics')
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

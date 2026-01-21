import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStatistics } from './useStatistics';

// Mock fetch
global.fetch = vi.fn();

describe('useStatistics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useStatistics', () => {
    it('should fetch statistics on mount', async () => {
      const mockData = {
        totalAnalyses: 1247,
        totalPromises: 5843,
        averageConfidence: 72.5,
        complianceRate: 68.3,
        byCategory: [],
        trends: [],
        lastUpdated: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('should handle loading state', async () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({}),
        }), 100))
      );

      const { result } = renderHook(() => useStatistics());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should provide refetch function', async () => {
      const mockData = {
        totalAnalyses: 1247,
        totalPromises: 5843,
        averageConfidence: 72.5,
        complianceRate: 68.3,
        byCategory: [],
        trends: [],
        lastUpdated: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
      });

      // Call refetch
      await result.current.refetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should auto-refetch at intervals', async () => {
      vi.useFakeTimers();

      const mockData = {
        totalAnalyses: 1247,
        totalPromises: 5843,
        averageConfidence: 72.5,
        complianceRate: 68.3,
        byCategory: [],
        trends: [],
        lastUpdated: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      renderHook(() => useStatistics());

      // Initial fetch
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('useCategoryStatistics', () => {
    it('should fetch category-specific statistics', async () => {
      const mockData = {
        category: 'Educação',
        total: 1200,
        fulfilled: 840,
        pending: 240,
        failed: 120,
        complianceRate: 70,
        topAuthors: [],
        monthlyTrend: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics('Educação'));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/statistics/category/Educação'
      );
    });

    it('should handle different categories', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const categories = ['Educação', 'Saúde', 'Infraestrutura'];

      for (const category of categories) {
        renderHook(() => useStatistics(category));
      }

      expect(global.fetch).toHaveBeenCalledWith('/api/statistics/category/Educação');
      expect(global.fetch).toHaveBeenCalledWith('/api/statistics/category/Saúde');
      expect(global.fetch).toHaveBeenCalledWith('/api/statistics/category/Infraestrutura');
    });
  });

  describe('useAuthorStatistics', () => {
    it('should fetch author-specific statistics', async () => {
      const mockData = {
        authorId: 'author-123',
        name: 'Autor Exemplo',
        totalPromises: 450,
        fulfilled: 315,
        pending: 90,
        failed: 45,
        complianceRate: 70,
        averageConfidence: 75.5,
        byCategory: [],
        historicalTrend: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics(undefined, 'author-123'));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/statistics/author/author-123'
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate returned data structure', async () => {
      const mockData = {
        totalAnalyses: 1247,
        totalPromises: 5843,
        averageConfidence: 72.5,
        complianceRate: 68.3,
        byCategory: [
          { category: 'Educação', count: 1200, fulfilled: 840, pending: 240, failed: 120 },
        ],
        trends: [
          { date: 'Jan', fulfilled: 65, pending: 20, failed: 15, complianceRate: 65 },
        ],
        lastUpdated: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.data?.totalAnalyses).toBeGreaterThan(0);
        expect(result.current.data?.averageConfidence).toBeGreaterThanOrEqual(0);
        expect(result.current.data?.averageConfidence).toBeLessThanOrEqual(100);
        expect(Array.isArray(result.current.data?.byCategory)).toBe(true);
        expect(Array.isArray(result.current.data?.trends)).toBe(true);
      });
    });

    it('should handle missing optional fields', async () => {
      const mockData = {
        totalAnalyses: 1247,
        totalPromises: 5843,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
        expect(result.current.error).toBeFalsy();
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.data).toBeNull();
      });
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});

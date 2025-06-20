import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface ScheduleItem {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleItem {
  title: string;
  subject: string;
  date: string;
  time: string;
}

export interface UpdateScheduleItem {
  title?: string;
  subject?: string;
  date?: string;
  time?: string;
  completed?: boolean;
}

export class ScheduleService {
  /**
   * Fetch all schedule items for a user
   */
  static async fetchScheduleItems(user: User): Promise<ScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      throw error;
    }
  }

  /**
   * Fetch schedule items for a specific date
   */
  static async fetchScheduleItemsByDate(user: User, date: string): Promise<ScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schedule items by date:', error);
      throw error;
    }
  }

  /**
   * Fetch upcoming schedule items (today and future)
   */
  static async fetchUpcomingScheduleItems(user: User, limit?: number): Promise<ScheduleItem[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('schedule')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming schedule items:', error);
      throw error;
    }
  }

  /**
   * Create a new schedule item
   */
  static async createScheduleItem(user: User, item: CreateScheduleItem): Promise<ScheduleItem> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .insert({
          user_id: user.id,
          title: item.title,
          subject: item.subject,
          date: item.date,
          time: item.time
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating schedule item:', error);
      throw error;
    }
  }

  /**
   * Update a schedule item
   */
  static async updateScheduleItem(
    user: User, 
    itemId: string, 
    updates: UpdateScheduleItem
  ): Promise<ScheduleItem> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating schedule item:', error);
      throw error;
    }
  }

  /**
   * Toggle completion status of a schedule item
   */
  static async toggleScheduleItemCompletion(
    user: User, 
    itemId: string
  ): Promise<ScheduleItem> {
    try {
      // First get the current item to toggle its completion status
      const { data: currentItem, error: fetchError } = await supabase
        .from('schedule')
        .select('completed')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('schedule')
        .update({
          completed: !currentItem.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling schedule item completion:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule item
   */
  static async deleteScheduleItem(user: User, itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics for a user
   */
  static async getScheduleStats(user: User): Promise<{
    total: number;
    completed: number;
    pending: number;
    todayItems: number;
    upcomingItems: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all items
      const { data: allItems, error: allError } = await supabase
        .from('schedule')
        .select('completed, date')
        .eq('user_id', user.id);

      if (allError) throw allError;

      const total = allItems?.length || 0;
      const completed = allItems?.filter(item => item.completed).length || 0;
      const pending = total - completed;
      const todayItems = allItems?.filter(item => item.date === today).length || 0;
      const upcomingItems = allItems?.filter(item => item.date >= today && !item.completed).length || 0;

      return {
        total,
        completed,
        pending,
        todayItems,
        upcomingItems
      };
    } catch (error) {
      console.error('Error getting schedule stats:', error);
      throw error;
    }
  }
}
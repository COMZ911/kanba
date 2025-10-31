'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Users,
  FolderOpen,
  Columns,
  CheckSquare
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
}

export function ActivityFeed({ projectId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const loadActivities = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: activities, error } = await query;

      if (error) throw error;
      setActivities(activities || []);
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการโหลดกิจกรรม:', error);
      toast.error('ไม่สามารถโหลดฟีดกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case 'project':
        return <FolderOpen className="h-4 w-4" />;
      case 'column':
        return <Columns className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'member':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'updated':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'deleted':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // ฟังก์ชันช่วยแปลง action ให้เป็นข้อความภาษาไทย (สำหรับ badge และประโยค)
  const actionLabelThai = (action: string) => {
    switch (action) {
      case 'created':
        return 'สร้าง';
      case 'updated':
        return 'แก้ไข';
      case 'deleted':
        return 'ลบ';
      default:
        return action; // เผื่อมี action อื่น ๆ ที่ไม่ได้ระบุไว้
    }
  };

  // ฟังก์ชันช่วยแปลง entity_type เป็นคำไทย (ไว้ใช้ในข้อความทั่วไปกรณี default)
  const entityTypeThai = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return 'โปรเจกต์';
      case 'column':
        return 'คอลัมน์';
      case 'task':
        return 'งาน';
      case 'comment':
        return 'ความคิดเห็น';
      case 'member':
        return 'สมาชิก';
      default:
        return entityType; // กรณีมีชนิดอื่น ๆ
    }
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const { action, entity_type, details } = activity;
    const userName = activity.profiles.full_name || activity.profiles.email;
    const actionTh = actionLabelThai(action);

    switch (entity_type) {
      case 'project':
        // เช่น "สมชาย สร้างโปรเจกต์"
        return `${userName} ${actionTh}โปรเจกต์`;
      case 'column': {
        const columnName = details?.name || details?.new?.name || 'คอลัมน์';
        // เช่น "สมชาย สร้างคอลัมน์ "To Do""
        return `${userName} ${actionTh}คอลัมน์ "${columnName}"`;
      }
      case 'task': {
        const taskTitle = details?.title || details?.new?.title || 'งาน';
        // เช่น "สมชาย แก้ไขงาน "ออกแบบหน้าแรก""
        return `${userName} ${actionTh}งาน "${taskTitle}"`;
      }
      case 'comment':
        // เช่น "สมชาย สร้างความคิดเห็น"
        return `${userName} ${actionTh}ความคิดเห็น`;
      case 'member':
        // กรณี member ใช้ข้อความพิเศษ
        if (action === 'created') {
          return `${userName} เข้าร่วมโปรเจกต์`;
        } else if (action === 'deleted' || action === 'ลบ') {
          return `${userName} ออกจากโปรเจกต์`;
        }
        return `${userName} ${actionTh}สมาชิกในทีม`;
      default:
        // เช่น "สมชาย แก้ไข entity_type"
        return `${userName} ${actionTh}${entityTypeThai(entity_type)}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'เมื่อสักครู่' : `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ชั่วโมงที่แล้ว`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} วันที่แล้ว`;
    } else {
      // แสดงวันที่ท้องถิ่นเป็นไทย (ขึ้นกับ locale ของระบบผู้ใช้)
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            กิจกรรมล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          กิจกรรมล่าสุด
        </CardTitle>
        <CardDescription>
          ดูกิจกรรมที่เกิดขึ้นในโปรเจกต์นี้แบบเรียลไทม์
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={activity.profiles.avatar_url || ''} alt={activity.profiles.full_name || ''} />
                <AvatarFallback className="text-xs">
                  {activity.profiles.full_name 
                    ? activity.profiles.full_name.charAt(0).toUpperCase() 
                    : activity.profiles.email.charAt(0).toUpperCase()
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className={`p-1 rounded-full ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.entity_type, activity.action)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {actionLabelThai(activity.action)}
                  </Badge>
                </div>
                
                <p className="text-sm text-foreground mt-1">
                  {formatActivityMessage(activity)}
                </p>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(activity.created_at)}
                </p>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีกิจกรรมใด ๆ</p>
              <p className="text-sm">กิจกรรมจะแสดงที่นี่เมื่อมีการทำงานในโปรเจกต์</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';

const taskSchema = z.object({
  task_name: z.string().min(1, '请输入任务名称'),
  numbers: z.string().min(1, '请输入号码'),
  cost_per_number: z.number().min(0.01, '单价至少0.01'),
});

type TaskForm = z.infer<typeof taskSchema>;

export function TaskCreate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [numbersList, setNumbersList] = useState<string[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { cost_per_number: 0.1 },
  });

  const onSubmit = async (data: TaskForm) => {
    if (numbersList.length === 0) {
      alert('请上传或输入号码');
      return;
    }
    setLoading(true);
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user?.id,
          task_name: data.task_name,
          total_numbers: numbersList.length,
          cost_per_number: data.cost_per_number,
          total_cost: numbersList.length * data.cost_per_number,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      // 分片入队
      const chunkSize = 1000;
      for (let i = 0; i < numbersList.length; i += chunkSize) {
        const chunk = numbersList.slice(i, i + chunkSize);
        await supabase.from('task_queue').insert({
          task_id: task.id,
          batch_no: Math.floor(i / chunkSize) + 1,
          numbers: chunk,
          status: 'pending',
          priority: 0,
        });
      }
      alert(`✅ 任务创建成功！共 ${numbersList.length} 个号码`);
      navigate('/tasks');
    } catch (error: any) {
      alert(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">创建新任务</h1>
        <p className="text-gray-400">输入号码或粘贴文本</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-cs-card border-cs-border">
          <div className="space-y-4">
            <Input label="任务名称" placeholder="例如：WhatsApp 号码检测" {...register('task_name')} error={errors.task_name?.message} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">输入号码（每行一个）</label>
              <textarea
                className="w-full bg-cs-dark border border-cs-border rounded-lg px-4 py-2.5 text-white h-32"
                placeholder="+1234567890&#10;+9876543210"
                onChange={(e) => {
                  const nums = e.target.value.split('\n').filter(n => n.trim());
                  setNumbersList(nums);
                }}
              />
              {numbersList.length > 0 && (
                <p className="text-sm text-green-500 mt-2">✅ 已加载 {numbersList.length} 个号码</p>
              )}
            </div>
            <Input label="每个号码消耗积分" type="number" step="0.01" {...register('cost_per_number', { valueAsNumber: true })} error={errors.cost_per_number?.message} />
            {numbersList.length > 0 && (
              <div className="bg-cs-dark rounded-lg p-4">
                <p className="text-gray-400">总计: <span className="text-white font-bold">{numbersList.length}</span> 个号码</p>
                <p className="text-gray-400">预估消耗: <span className="text-cs-gold font-bold">{(numbersList.length * watch('cost_per_number')).toFixed(2)}</span> 积分</p>
              </div>
            )}
          </div>
        </Card>
        <div className="flex gap-4">
          <Button type="submit" loading={loading} className="flex-1">创建任务</Button>
          <Button variant="secondary" onClick={() => navigate('/tasks')}>取消</Button>
        </div>
      </form>
    </div>
  );
}

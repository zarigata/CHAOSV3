// ==========================================================
// 🌐 C.H.A.O.S. CREATE HUB COMPONENT 🌐
// ==========================================================
// █▀▀ █▀█ █▀▀ ▄▀█ ▀█▀ █▀▀   █░█ █░█ █▄▄   █▀▀ █░░ █▀█ █░█░█
// █▄▄ █▀▄ ██▄ █▀█ ░█░ ██▄   █▀█ █▄█ █▄█   █▀░ █▄▄ █▄█ ▀▄▀▄▀
// ==========================================================
// [CODEX-1337] THIS MODULE ENABLES CREATION OF COMMUNITY HUBS
// [CODEX-1337] WHICH FUNCTION SIMILAR TO DISCORD SERVERS BUT
// [CODEX-1337] WITH THE NOSTALGIC AESTHETIC OF MSN MESSENGER
// [CODEX-1337] PROVIDES MULTI-STEP VALIDATION AND REAL-TIME FEEDBACK
// ==========================================================

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Form validation
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Icons
import { 
  Users, 
  Check, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Hash 
} from 'lucide-react';

// Schema for hub creation form
const hubSchema = z.object({
  name: z.string()
    .min(3, { message: 'Hub name must be at least 3 characters' })
    .max(50, { message: 'Hub name cannot exceed 50 characters' }),
  description: z.string()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional(),
  isPrivate: z.boolean().default(false),
  initialChannels: z.array(
    z.object({
      name: z.string()
        .min(2, { message: 'Channel name must be at least 2 characters' })
        .max(30, { message: 'Channel name cannot exceed 30 characters' })
        .refine(val => /^[a-z0-9-]+$/.test(val), { 
          message: 'Channel name can only contain lowercase letters, numbers, and hyphens' 
        }),
      description: z.string().max(100).optional(),
    })
  ).min(1, { message: 'At least one channel is required' }),
});

type HubFormData = z.infer<typeof hubSchema>;

export function CreateHubForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hubIconPreview, setHubIconPreview] = useState<string | null>(null);
  
  // Form validation
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    getValues,
    watch,
  } = useForm<HubFormData>({
    resolver: zodResolver(hubSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
      initialChannels: [
        { name: 'general', description: 'General discussion' }
      ],
    }
  });
  
  // Watch for channel changes
  const initialChannels = watch('initialChannels');
  
  // Handle icon selection
  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setHubIconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Add a new channel
  const addChannel = () => {
    const currentChannels = getValues('initialChannels') || [];
    setValue('initialChannels', [
      ...currentChannels, 
      { name: '', description: '' }
    ]);
  };
  
  // Remove a channel
  const removeChannel = (index: number) => {
    if (initialChannels.length <= 1) return;
    
    const updatedChannels = [...initialChannels];
    updatedChannels.splice(index, 1);
    setValue('initialChannels', updatedChannels);
  };
  
  // Handle form submission
  const onSubmit = async (data: HubFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulating API call
      console.log('Creating hub:', data);
      
      // In a real implementation, we would do:
      // 1. Upload the hub icon to a storage service
      // 2. Create the hub with the returned icon URL
      // 3. Create all the initial channels
      // 4. Navigate to the new hub
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success, navigate to new hub (using a fake ID for now)
      navigate('/app/hub/new-hub-123');
    } catch (error) {
      console.error('Error creating hub:', error);
      setIsSubmitting(false);
    }
  };
  
  // Next step handler
  const handleNext = () => {
    if (step === 1 && (!getValues('name') || errors.name)) {
      return;
    }
    
    if (step === 2 && (initialChannels.length === 0 || errors.initialChannels)) {
      return;
    }
    
    setStep(prev => (prev === 3 ? 3 : prev + 1) as 1 | 2 | 3);
  };
  
  // Previous step handler
  const handlePrev = () => {
    setStep(prev => (prev === 1 ? 1 : prev - 1) as 1 | 2 | 3);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="msn-window max-w-2xl"
    >
      <div className="msn-header flex items-center justify-between text-sm font-medium">
        <h2 className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Create a New Hub
        </h2>
        
        <div className="flex text-xs">
          <div className={`px-2 ${step >= 1 ? 'text-msn-primary' : 'text-muted-foreground'}`}>
            Basic Info
          </div>
          <div className={`px-2 ${step >= 2 ? 'text-msn-primary' : 'text-muted-foreground'}`}>
            Channels
          </div>
          <div className={`px-2 ${step >= 3 ? 'text-msn-primary' : 'text-muted-foreground'}`}>
            Review
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Hub Information */}
        {step === 1 && (
          <div className="p-4">
            <div className="mb-6 flex items-center justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-msn-primary/50"
              >
                {hubIconPreview ? (
                  <img 
                    src={hubIconPreview} 
                    alt="Hub icon" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleIconSelect}
              />
            </div>
            
            <p className="mb-4 text-center text-xs text-muted-foreground">
              {hubIconPreview ? 'Click to change icon' : 'Click to upload a hub icon (optional)'}
            </p>
            
            <div className="mb-4">
              <label htmlFor="hubName" className="msn-label mb-1 block text-sm font-medium">
                Hub Name <span className="text-destructive">*</span>
              </label>
              <input
                id="hubName"
                type="text"
                className={`
                  w-full rounded-md border bg-background px-3 py-2 text-sm
                  ${errors.name ? 'border-destructive' : 'border-input'}
                `}
                placeholder="e.g., Gaming Community"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="msn-label mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="What's this hub about?"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="isPrivate"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...register('isPrivate')}
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm">
                  Make this hub private
                </label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Private hubs are only visible to invited members
              </p>
            </div>
          </div>
        )}
        
        {/* Step 2: Channel Setup */}
        {step === 2 && (
          <div className="p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Create channels for different topics. Every hub needs at least one channel.
            </p>
            
            <div className="mb-4 max-h-64 overflow-y-auto space-y-4">
              {initialChannels.map((channel, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Channel {index + 1}</span>
                    </div>
                    
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeChannel(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <label className="msn-label mb-1 block text-xs font-medium">
                      Channel Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      className={`
                        w-full rounded-md border bg-background px-3 py-1.5 text-sm
                        ${errors.initialChannels?.[index]?.name ? 'border-destructive' : 'border-input'}
                      `}
                      placeholder="e.g., general"
                      {...register(`initialChannels.${index}.name` as const)}
                    />
                    {errors.initialChannels?.[index]?.name && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.initialChannels[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="msn-label mb-1 block text-xs font-medium">
                      Description
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      placeholder="What's this channel for?"
                      {...register(`initialChannels.${index}.description` as const)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addChannel}
              className="flex w-full items-center justify-center rounded-md border border-input bg-background p-2 text-sm hover:bg-muted"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Channel
            </button>
          </div>
        )}
        
        {/* Step 3: Review Information */}
        {step === 3 && (
          <div className="p-4">
            <h3 className="mb-2 text-center text-lg font-bold">Hub Summary</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Review your hub details before creating
            </p>
            
            <div className="mb-4 flex items-center justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
                {hubIconPreview ? (
                  <img 
                    src={hubIconPreview} 
                    alt="Hub icon" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-center text-lg font-semibold">{watch('name')}</h4>
              {watch('description') && (
                <p className="text-center text-sm text-muted-foreground">{watch('description')}</p>
              )}
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {watch('isPrivate') ? 'Private hub' : 'Public hub'}
              </p>
            </div>
            
            <div className="rounded-md border border-border p-3">
              <h4 className="mb-2 font-medium">Channels</h4>
              <ul className="space-y-1">
                {watch('initialChannels').map((channel, index) => (
                  <li key={index} className="flex items-center gap-1 text-sm">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span>{channel.name}</span>
                    {channel.description && (
                      <span className="text-xs text-muted-foreground">
                        - {channel.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Step navigation */}
        <div className="msn-footer flex justify-between border-t border-border p-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-msn-primary px-4 py-2 text-sm text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                flex items-center rounded-md bg-msn-primary px-4 py-2 text-sm text-white
                ${isSubmitting ? 'opacity-70' : ''}
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Create Hub
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}

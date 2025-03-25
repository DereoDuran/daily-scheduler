'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';

export default function Home() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Coffee Time', duration: 60, preferredTime: 'morning', priority: 0, description: '' },
    { id: 2, text: 'Lunch', duration: 60, preferredTime: 'afternoon', priority: 0, description: '' },
    { id: 3, text: 'Dinner', duration: 60, preferredTime: 'evening', priority: 0, description: '' },
    { id: 4, text: 'Read', duration: 30, preferredTime: 'afternoon', priority: 0, description: '' },
    { id: 5, text: 'Gym', duration: 90, preferredTime: 'afternoon', priority: 0, description: '' },
    { id: 6, text: 'Walk the dog', duration: 20, preferredTime: 'morning', priority: 0, description: '' },
    { id: 7, text: 'Walk the dog', duration: 20, preferredTime: 'afternoon', priority: 0, description: '' },
    { id: 8, text: 'Meditate', duration: 15, preferredTime: 'morning', priority: 0, description: '' },
    { id: 9, text: 'Focus Time', duration: 120, preferredTime: 'afternoon', priority: 0, description: '' }
  ]);
  const [selectedQuickTasks, setSelectedQuickTasks] = useState([
    'Coffee Time-60-morning',
    'Lunch-60-afternoon',
    'Dinner-60-evening',
    'Read-30-afternoon',
    'Gym-90-afternoon',
    'Walk the dog-20-morning',
    'Walk the dog-20-afternoon',
    'Meditate-15-morning',
    'Focus Time-120-afternoon'
  ]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPreferredTime, setNewTaskPreferredTime] = useState('morning');
  const [wakeTime, setWakeTime] = useState(7 * 4); // 7:00 AM (in 15-min intervals)
  const [sleepTime, setSleepTime] = useState(22 * 4); // 10:00 PM (in 15-min intervals)
  const [isDragging, setIsDragging] = useState(null); // 'wake' or 'sleep'
  const [schedule, setSchedule] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const sliderRef = useRef(null);
  const scheduleRef = useRef(null);

  const timeOptions = ['morning', 'afternoon', 'evening'];

  const presetTasks = [
    { text: 'Coffee Time', duration: 60, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Lunch', duration: 60, preferredTime: 'afternoon', priority: 0, description: '' },
    { text: 'Dinner', duration: 60, preferredTime: 'evening', priority: 0, description: '' },
    { text: 'Read', duration: 30, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Gym', duration: 60, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Walk the dog', duration: 20, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Meditate', duration: 15, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Focus Time', duration: 120, preferredTime: 'morning', priority: 0, description: '' },
    { text: 'Study', duration: 120, preferredTime: 'afternoon', priority: 0, description: '' },
    { text: 'Cook', duration: 45, preferredTime: 'evening', priority: 0, description: '' },
    { text: 'Clean', duration: 60, preferredTime: 'afternoon', priority: 0, description: '' },
    { text: 'Shopping', duration: 90, preferredTime: 'afternoon', priority: 0, description: '' },
    { text: 'Call family', duration: 30, preferredTime: 'evening', priority: 0, description: '' }
  ];

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        duration: 30, // Default 30 minutes
        preferredTime: newTaskPreferredTime,
        priority: 0,   // Initialize with default priority
        description: '' // Initialize with empty description
      }]);
      setNewTask('');
      setNewTaskPreferredTime('morning'); // Reset to default
    }
  };

  const addPresetTask = (task) => {
    const taskKey = `${task.text}-${task.duration}-${task.preferredTime}`;
    const isSelected = selectedQuickTasks.includes(taskKey);

    if (isSelected) {
      // Remove from selected tasks and remove from task list
      setSelectedQuickTasks(selectedQuickTasks.filter(t => t !== taskKey));
      setTasks(tasks.filter(t =>
        !(t.text === task.text && t.duration === task.duration && t.preferredTime === task.preferredTime)
      ));
    } else {
      // Add to selected tasks and add to task list
      setSelectedQuickTasks([...selectedQuickTasks, taskKey]);
      setTasks([...tasks, {
        id: Date.now(),
        text: task.text,
        duration: task.duration,
        preferredTime: task.preferredTime,
        priority: 0,   // Initialize with default priority
        description: '' // Initialize with empty description
      }]);
    }
  };

  const toggleTask = (taskId) => {
    setSchedule(schedule.map(item =>
      item.taskId === taskId ? { ...item, completed: !item.completed } : item
    ));
  };

  const adjustDuration = (taskId, minutes) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newDuration = Math.max(15, task.duration + minutes); // Minimum 15 minutes
        return { ...task, duration: newDuration };
      }
      return task;
    }));
  };

  const updatePreferredTime = (taskId, newTime) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, preferredTime: newTime } : task
    ));
  };

  // Function to move a task earlier in the schedule
  const moveTaskEarlier = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Logic to adjust preferred time or add preferred start time
    if (task.preferredTime === 'afternoon') {
      updatePreferredTime(taskId, 'morning');
    } else if (task.preferredTime === 'evening') {
      updatePreferredTime(taskId, 'afternoon');
    } else {
      // If already morning, decrease the priority within morning
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            priority: (t.priority || 0) - 1
          };
        }
        return t;
      }));
    }
  };

  // Function to move a task later in the schedule
  const moveTaskLater = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Logic to adjust preferred time or add preferred start time
    if (task.preferredTime === 'morning') {
      updatePreferredTime(taskId, 'afternoon');
    } else if (task.preferredTime === 'afternoon') {
      updatePreferredTime(taskId, 'evening');
    } else {
      // If already evening, increase the priority within evening
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            priority: (t.priority || 0) + 1
          };
        }
        return t;
      }));
    }
  };

  // Shift a task's start time 15 minutes earlier
  const shiftTaskEarlier = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If the task has an explicit start time, adjust it
    if (task.preferredStartTime) {
      const currentStartTime = timeToMinutes(task.preferredStartTime);
      if (currentStartTime !== null && currentStartTime > wakeTime) {
        // Move 15 minutes (1 slot) earlier, but not before wake time
        const newStartTime = Math.max(wakeTime, currentStartTime - 1);
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, preferredStartTime: formatTime(newStartTime) } : t
        ));
      }
    } else {
      // Add a preferred start time property if none exists
      const scheduleItem = schedule.find(item => item.taskId === taskId);
      if (scheduleItem) {
        const currentStartTime = timeToMinutes(scheduleItem.startTime);
        if (currentStartTime !== null && currentStartTime > wakeTime) {
          const newStartTime = Math.max(wakeTime, currentStartTime - 1);
          setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, preferredStartTime: formatTime(newStartTime) } : t
          ));
        }
      }
    }
  };

  // Shift a task's start time 15 minutes later
  const shiftTaskLater = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If the task has an explicit start time, adjust it
    if (task.preferredStartTime) {
      const currentStartTime = timeToMinutes(task.preferredStartTime);
      const taskDurationSlots = Math.ceil(task.duration / 15);

      if (currentStartTime !== null && currentStartTime + taskDurationSlots < sleepTime) {
        // Move 15 minutes (1 slot) later, but ensure task ends before sleep time
        const newStartTime = Math.min(sleepTime - taskDurationSlots, currentStartTime + 1);
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, preferredStartTime: formatTime(newStartTime) } : t
        ));
      }
    } else {
      // Add a preferred start time property if none exists
      const scheduleItem = schedule.find(item => item.taskId === taskId);
      if (scheduleItem) {
        const currentStartTime = timeToMinutes(scheduleItem.startTime);
        const taskDurationSlots = Math.ceil(task.duration / 15);

        if (currentStartTime !== null && currentStartTime + taskDurationSlots < sleepTime) {
          const newStartTime = Math.min(sleepTime - taskDurationSlots, currentStartTime + 1);
          setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, preferredStartTime: formatTime(newStartTime) } : t
          ));
        }
      }
    }
  };

  const formatTime = (minutes) => {
    const hour = Math.floor(minutes / 4);
    const quarter = minutes % 4;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const quarterText = quarter === 0 ? '00' : quarter === 1 ? '15' : quarter === 2 ? '30' : '45';
    return `${displayHour}:${quarterText} ${period}`;
  };

  const calculateWakeDuration = () => {
    return (sleepTime - wakeTime) / 4;
  };

  const handleSliderMouseDown = (handle) => {
    setIsDragging(handle);
  };

  const handleSliderMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = Math.round((5 * 4) + (percentage * (18 * 4))); // 5:00 to 23:00 in 15-min intervals

    // Prevent wake time from being after or equal to sleep time
    if (isDragging === 'wake') {
      const proposedTime = Math.min(newTime, sleepTime - 4);
      setWakeTime(proposedTime);
    } else if (isDragging === 'sleep') {
      const proposedTime = Math.max(newTime, wakeTime + 4);
      setSleepTime(proposedTime);
    }
  };

  const handleSliderMouseUp = () => {
    setIsDragging(null);
  };

  // Helper function to convert time string to minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 4 + Math.floor(minutes / 15);
  };

  const generateSchedule = useCallback(() => {
    // Ensure wake time is always before sleep time
    if (wakeTime >= sleepTime) {
      setSchedule([]);
      setUnscheduledTasks(tasks);
      return;
    }

    // The time slots are in 15-minute intervals (quarter hours)
    const totalSlots = sleepTime - wakeTime;
    const timeSlots = Array(totalSlots).fill(null);

    // First, schedule tasks with specific start times
    const tasksWithStartTimes = tasks.filter(task => task.preferredStartTime);
    const tasksWithoutStartTimes = tasks.filter(task => !task.preferredStartTime);

    const unscheduled = [];

    // Schedule tasks with explicit start times first
    tasksWithStartTimes.forEach(task => {
      const startTimeSlot = timeToMinutes(task.preferredStartTime);
      if (startTimeSlot === null || startTimeSlot < wakeTime || startTimeSlot >= sleepTime) {
        unscheduled.push(task);
        return;
      }

      // Convert to relative slot (relative to wake time)
      const relativeStartSlot = startTimeSlot - wakeTime;
      const slotsNeeded = Math.ceil(task.duration / 15);

      // Check if we have enough space
      if (relativeStartSlot + slotsNeeded > totalSlots) {
        unscheduled.push(task);
        return;
      }

      // Check if slots are available
      let canSchedule = true;
      for (let i = 0; i < slotsNeeded; i++) {
        if (timeSlots[relativeStartSlot + i] !== null) {
          canSchedule = false;
          break;
        }
      }

      if (!canSchedule) {
        unscheduled.push(task);
        return;
      }

      // Schedule the task
      const endTimeSlot = startTimeSlot + slotsNeeded;
      const taskObject = {
        taskId: task.id,
        taskName: task.text,
        duration: task.duration,
        preferredTime: task.preferredTime,
        startTime: formatTime(startTimeSlot),
        endTime: formatTime(endTimeSlot),
        completed: false
      };

      // Fill the slots with the task
      for (let i = 0; i < slotsNeeded; i++) {
        timeSlots[relativeStartSlot + i] = taskObject;
      }
    });

    // Now group remaining tasks by preferred time
    const tasksByTime = {
      morning: tasksWithoutStartTimes
        .filter(task => task.preferredTime === 'morning')
        .sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      afternoon: tasksWithoutStartTimes
        .filter(task => task.preferredTime === 'afternoon')
        .sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      evening: tasksWithoutStartTimes
        .filter(task => task.preferredTime === 'evening')
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    };

    // Define time ranges for each period (in slots from wake time)
    const timeRanges = {
      morning: { start: 0, end: Math.floor(totalSlots * 0.4) },
      afternoon: { start: Math.floor(totalSlots * 0.4), end: Math.floor(totalSlots * 0.7) },
      evening: { start: Math.floor(totalSlots * 0.7), end: totalSlots }
    };

    // Helper function to find available slots
    const findAvailableSlots = (startSlot, slotsNeeded) => {
      for (let i = startSlot; i <= timeSlots.length - slotsNeeded; i++) {
        let isAvailable = true;
        for (let j = 0; j < slotsNeeded; j++) {
          if (timeSlots[i + j] !== null) {
            isAvailable = false;
            break;
          }
        }
        if (isAvailable) return i;
      }
      return -1;
    };

    // Schedule tasks for each time period
    Object.entries(tasksByTime).forEach(([period, periodTasks]) => {
      const range = timeRanges[period];

      periodTasks.forEach(task => {
        // Convert duration in minutes to number of quarter-hour slots needed
        const slotsNeeded = Math.ceil(task.duration / 15);
        let startSlot = -1;

        // Try to find slots in the preferred time range
        startSlot = findAvailableSlots(range.start, slotsNeeded);

        // If no slots found, try the entire day
        if (startSlot === -1) {
          startSlot = findAvailableSlots(0, slotsNeeded);
        }

        // If we found a slot, schedule the task
        if (startSlot !== -1) {
          const startTimeSlot = wakeTime + startSlot;
          const endTimeSlot = startTimeSlot + slotsNeeded;

          const taskObject = {
            taskId: task.id,
            taskName: task.text,
            duration: task.duration,
            preferredTime: task.preferredTime,
            startTime: formatTime(startTimeSlot),
            endTime: formatTime(endTimeSlot),
            completed: false
          };

          // Fill the slots with the task
          for (let i = 0; i < slotsNeeded; i++) {
            timeSlots[startSlot + i] = taskObject;
          }
        } else {
          // Add to unscheduled tasks if no slot was found
          unscheduled.push(task);
        }
      });
    });

    // Set unscheduled tasks
    setUnscheduledTasks([...unscheduled]);

    // Convert time slots to schedule array with proper free time blocks
    const newSchedule = [];
    let currentTask = null;
    let lastTaskEnd = 0;

    // Process each time slot
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];

      // If this is a task slot and it's different from the current task
      if (slot !== null && (currentTask === null || slot.taskId !== currentTask.taskId)) {
        // If there's a gap between tasks, add free time
        if (i > lastTaskEnd) {
          const freeTimeStart = wakeTime + lastTaskEnd;
          const freeTimeEnd = wakeTime + i;

          // Calculate duration in minutes (convert slots to minutes)
          const freeDuration = (i - lastTaskEnd) * 15;

          newSchedule.push({
            taskId: 'free-time',
            taskName: 'Free Time',
            duration: freeDuration,
            preferredTime: 'flexible',
            startTime: formatTime(freeTimeStart),
            endTime: formatTime(freeTimeEnd),
            completed: false
          });
        }

        // Add the new task
        newSchedule.push(slot);
        currentTask = slot;

        // Find where this task ends
        let taskEnd = i;
        while (taskEnd + 1 < timeSlots.length &&
               timeSlots[taskEnd + 1] !== null &&
               timeSlots[taskEnd + 1].taskId === slot.taskId) {
          taskEnd++;
        }

        lastTaskEnd = taskEnd + 1;
      }
    }

    // Add final free time if there's space at the end
    if (lastTaskEnd < timeSlots.length) {
      const freeTimeStart = wakeTime + lastTaskEnd;
      const freeTimeEnd = sleepTime;
      const freeDuration = (timeSlots.length - lastTaskEnd) * 15;

      newSchedule.push({
        taskId: 'free-time',
        taskName: 'Free Time',
        duration: freeDuration,
        preferredTime: 'flexible',
        startTime: formatTime(freeTimeStart),
        endTime: formatTime(freeTimeEnd),
        completed: false
      });
    }

    // Add free time at beginning if first task doesn't start at wake time
    if (newSchedule.length > 0 && timeToMinutes(newSchedule[0].startTime) > wakeTime) {
      const firstTaskStart = timeToMinutes(newSchedule[0].startTime);
      const freeDuration = (firstTaskStart - wakeTime) * 15;

      newSchedule.unshift({
        taskId: 'free-time',
        taskName: 'Free Time',
        duration: freeDuration,
        preferredTime: 'flexible',
        startTime: formatTime(wakeTime),
        endTime: formatTime(firstTaskStart),
        completed: false
      });
    }

    // If no tasks scheduled, add one free time block for the entire day
    if (newSchedule.length === 0) {
      newSchedule.push({
        taskId: 'free-time',
        taskName: 'Free Time',
        duration: (sleepTime - wakeTime) * 15,
        preferredTime: 'flexible',
        startTime: formatTime(wakeTime),
        endTime: formatTime(sleepTime),
        completed: false
      });
    }

    setSchedule(newSchedule);
  }, [tasks, wakeTime, sleepTime]);

  // Add useEffect to regenerate schedule when tasks or time window changes
  useEffect(() => {
    generateSchedule();
  }, [generateSchedule]);

  // Clear all tasks
  const clearAllTasks = () => {
    if (window.confirm('Are you sure you want to clear all tasks?')) {
      setTasks([]);
    }
  };

  // Function to save schedule as image
  const saveAsImage = async () => {
    if (!scheduleRef.current) return;

    try {
      // Show a loading indicator or message
      const targetElement = scheduleRef.current;

      // Create a clone of the element to avoid modifying the original DOM
      const clone = targetElement.cloneNode(true);
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = `${targetElement.offsetWidth}px`;
      container.style.backgroundColor = '#f5f5f7';
      container.style.padding = '1.5rem';
      container.style.borderRadius = '1rem';
      container.style.boxShadow = '0 10px 15px -5px rgba(0, 0, 0, 0.1), 0 5px 5px -5px rgba(0, 0, 0, 0.04)';
      container.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      container.style.background = '#f5f5f7';
      container.style.backdropFilter = 'blur(20px)';

      // Create a background wrapper div
      const backgroundWrapper = document.createElement('div');
      backgroundWrapper.style.position = 'absolute';
      backgroundWrapper.style.top = '0';
      backgroundWrapper.style.left = '0';
      backgroundWrapper.style.right = '0';
      backgroundWrapper.style.bottom = '0';
      backgroundWrapper.style.backgroundColor = '#f5f5f7';
      backgroundWrapper.style.zIndex = '-1';
      container.appendChild(backgroundWrapper);

      // First append the clone to the container
      container.appendChild(clone);

      // Add decorative header
      const decorativeHeader = document.createElement('div');
      decorativeHeader.style.textAlign = 'center';
      decorativeHeader.style.marginBottom = '1.5rem';
      decorativeHeader.style.paddingBottom = '1rem';
      decorativeHeader.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
      decorativeHeader.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
      decorativeHeader.style.borderRadius = '0.5rem 0.5rem 0 0';
      decorativeHeader.style.margin = '-1.5rem -1.5rem 1rem -1.5rem';
      decorativeHeader.style.padding = '1rem 1.5rem';
      decorativeHeader.style.backdropFilter = 'blur(10px)';
      decorativeHeader.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.25rem; color: #333333; font-weight: 600;">Daily Schedule</div>
      `;
      container.insertBefore(decorativeHeader, clone);

      // Style the schedule items
      const scheduleItems = clone.querySelectorAll('.schedule-container > div');
      scheduleItems.forEach(item => {
        // Hide all buttons in the task
        const buttons = item.querySelectorAll('button');
        buttons.forEach(button => {
          button.style.display = 'none';
        });

        if (item.taskId === 'free-time') {
          item.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)';
          item.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        } else if (item.completed) {
          item.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)';
          item.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        } else {
          const timeOfDay = item.preferredTime;
          let gradientColors = '';
          switch(timeOfDay) {
            case 'morning':
              gradientColors = 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)';
              break;
            case 'afternoon':
              gradientColors = 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)';
              break;
            case 'evening':
              gradientColors = 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)';
              break;
          }
          item.style.background = gradientColors;
          item.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        }
        item.style.backdropFilter = 'blur(5px)';
        item.style.borderRadius = '1rem';
      });

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#f5f5f7',
        removeContainer: true,
        allowTaint: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          // Additional cleanup on the cloned document
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach(el => {
            // Remove any remaining computed styles that might cause issues
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
              el.style.backgroundImage = 'none';
            }
            // Ensure background color is preserved
            if (el === clonedDoc.body || el === clonedDoc.documentElement) {
              el.style.backgroundColor = '#f5f5f7';
            }
          });
        }
      });

      // Remove the temporary container after rendering
      document.body.removeChild(container);

      // For iPhone/Safari we need to handle this differently
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isIOS) {
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Open the image in a new tab for iOS users to save
        window.open(dataUrl);
      } else {
        // For non-iOS devices, use standard download approach
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `daily-schedule-${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      }
    } catch (error) {
      console.error('Error saving schedule as image:', error);
    }
  };

  // Handle opening the edit task modal
  const openEditTaskModal = (taskId) => {
    console.log('Opening edit modal for task:', taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('Task not found:', taskId);
      return;
    }

    setEditingTask(task);
    setEditTaskName(task.text);
    setEditTaskDescription(task.description || '');
    console.log('Modal state updated, editingTask:', task);
  };

  // Save edited task details
  const saveEditedTask = () => {
    console.log('Saving edited task:', editingTask);
    if (!editingTask) return;

    setTasks(tasks.map(task =>
      task.id === editingTask.id
        ? { ...task, text: editTaskName, description: editTaskDescription }
        : task
    ));

    closeEditTaskModal();
  };

  // Close the edit task modal
  const closeEditTaskModal = () => {
    console.log('Closing edit modal');
    setEditingTask(null);
    setEditTaskName('');
    setEditTaskDescription('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-3 sm:p-6 flex flex-col">
        {/* Header */}
        <header className="text-center mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-2">
            ✨ Daily Vibe Planner ✨
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Craft your perfect day&apos;s rhythm ✦ ✧ ✦
          </p>

          {/* Test modal button - remove after debugging */}
          <button
            onClick={() => {
              console.log("Test modal button clicked");
              if (tasks.length > 0) {
                openEditTaskModal(tasks[0].id);
              }
            }}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
          >
            Test Edit Modal
          </button>
        </header>

        {/* Time Range Slider */}
        <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-md border border-gray-100/60 dark:border-gray-700/60 hover:shadow-xl transition-all duration-300">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-lg">⏰</span> Waking Hours
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                  <span className="hidden sm:inline">🌅</span> Wake: {formatTime(wakeTime)}
                </span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                  <span className="hidden sm:inline">🌙</span> Sleep: {formatTime(sleepTime)}
                </span>
              </div>
              <div
                ref={sliderRef}
                className="relative h-5 sm:h-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-gray-700 dark:to-gray-600 rounded-full shadow-inner touch-none"
                onMouseMove={handleSliderMouseMove}
                onMouseUp={handleSliderMouseUp}
                onMouseLeave={handleSliderMouseUp}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const rect = sliderRef.current.getBoundingClientRect();
                  const x = touch.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                  const newTime = Math.round((5 * 4) + (percentage * (18 * 4)));

                  if (isDragging === 'wake' && newTime < sleepTime - 4) { // Ensure a minimum gap of 1 hour
                    setWakeTime(newTime);
                  } else if (isDragging === 'sleep' && newTime > wakeTime + 4) { // Ensure a minimum gap of 1 hour
                    setSleepTime(newTime);
                  }
                }}
                onTouchEnd={handleSliderMouseUp}
              >
                {/* Time markers */}
                <div className="absolute w-full h-full flex justify-between px-2 text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">
                  <span>5AM</span>
                  <span className="hidden sm:block">9AM</span>
                  <span>1PM</span>
                  <span className="hidden sm:block">5PM</span>
                  <span>9PM</span>
                </div>

                {/* Wake duration highlight */}
                <div
                  className="absolute h-full bg-gradient-to-r from-indigo-400 to-violet-400 dark:from-indigo-600/70 dark:to-violet-600/70 rounded-full shadow-sm"
                  style={{
                    left: `${((wakeTime - (5 * 4)) / (18 * 4)) * 100}%`,
                    width: `${((sleepTime - wakeTime) / (18 * 4)) * 100}%`
                  }}
                />
                {/* Wake time handle */}
                <div
                  className="absolute w-6 h-6 sm:w-5 sm:h-5 bg-white border-2 border-indigo-500 rounded-full -mt-0.5 cursor-pointer
                           hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg
                           hover:border-indigo-600 active:scale-95 touch-none"
                  style={{
                    left: `${((wakeTime - (5 * 4)) / (18 * 4)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                  onMouseDown={() => handleSliderMouseDown('wake')}
                  onTouchStart={() => handleSliderMouseDown('wake')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] sm:hidden">☀️</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full sm:block hidden"></div>
                  </div>
                </div>
                {/* Sleep time handle */}
                <div
                  className="absolute w-6 h-6 sm:w-5 sm:h-5 bg-white border-2 border-violet-500 rounded-full -mt-0.5 cursor-pointer
                           hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg
                           hover:border-violet-600 active:scale-95 touch-none"
                  style={{
                    left: `${((sleepTime - (5 * 4)) / (18 * 4)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                  onMouseDown={() => handleSliderMouseDown('sleep')}
                  onTouchStart={() => handleSliderMouseDown('sleep')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] sm:hidden">🌙</span>
                    <div className="w-2 h-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full sm:block hidden"></div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  ⏱️ {calculateWakeDuration()} hours for your brilliance ✦
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Task Buttons */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="text-lg">🎯</span> Quick Tasks
            </h2>
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showAllTasks ? 'Show less' : `Show all (${presetTasks.length})`}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(showAllTasks ? presetTasks : presetTasks.slice(0, 8)).map((task, index) => {
              const taskKey = `${task.text}-${task.duration}-${task.preferredTime}`;
              const isSelected = selectedQuickTasks.includes(taskKey);
              return (
                <button
                  key={index}
                  onClick={() => addPresetTask(task)}
                  className={`px-3 py-2 backdrop-blur-md text-gray-700 dark:text-gray-300
                           rounded-lg border transition-all duration-300 text-xs
                           hover:shadow-md active:scale-95
                           ${isSelected
                             ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                             : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600/40'
                           }`}
                >
                  {task.text} <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500 dark:text-indigo-400'}>({task.duration}m)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Input Form */}
        <form onSubmit={addTask} className="mb-5 sm:mb-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-md border border-gray-100/60 dark:border-gray-700/60 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="✦ Add your task..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50
                         bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/70 shadow-sm text-sm
                         transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              />
              <button
                type="submit"
                className="sm:w-auto w-full mt-1 sm:mt-0 px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg
                         hover:from-indigo-600 hover:to-violet-600 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/70 shadow-sm hover:shadow-md
                         text-sm font-medium active:scale-95"
              >
                Add Task
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Time preference:</label>
              <div className="flex gap-2 flex-wrap">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setNewTaskPreferredTime(time)}
                    className={`px-3 py-2 rounded-lg border transition-all duration-300 text-xs sm:text-sm
                      ${newTaskPreferredTime === time
                        ? time === 'morning'
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                          : time === 'afternoon'
                            ? 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300'
                            : 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                        : 'bg-white/80 dark:bg-gray-800/80 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300'
                      } ${time === 'morning' ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20' :
                         time === 'afternoon' ? 'hover:bg-sky-50 dark:hover:bg-sky-900/20' :
                         'hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
                  >
                    {time === 'morning' ? '🌅 Morning' : time === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Schedule Display */}
        {schedule.length > 0 && (
          <div className="mt-6 p-3 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100/60 dark:border-gray-700/60 flex flex-col min-h-0">
            <div ref={scheduleRef} className="schedule-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col min-h-0">
              {unscheduledTasks.length > 0 && (
                <div className="mb-3 sm:mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex-shrink-0">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <span className="text-base sm:text-lg">⚠️</span>
                    <p className="text-xs sm:text-sm font-medium">
                      {unscheduledTasks.length} task{unscheduledTasks.length !== 1 ? 's' : ''} couldn&apos;t be scheduled:
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {unscheduledTasks.map(task => (
                      <li key={task.id} className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                        • {task.text} ({task.duration}m) - {task.preferredTime}
                        {task.preferredStartTime && ` at ${task.preferredStartTime}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="relative flex flex-col flex-1 min-h-0" style={{ minHeight: `${(sleepTime - wakeTime) * 2}px` }}>
                <div className="flex flex-col gap-2 sm:gap-3 w-full flex-1 min-h-0">
                  {schedule.map((item, index) => (
                    <div
                      key={`${item.taskId}-${index}`}
                      className={`relative flex flex-col gap-1 p-2 sm:p-3 rounded-lg overflow-hidden flex-shrink-0
                             ${item.taskId === 'free-time'
                               ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50'
                               : item.preferredTime === 'morning'
                                 ? 'bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-900/20 dark:to-amber-800/20 border-l-4 border-amber-300 dark:border-amber-600'
                                 : item.preferredTime === 'afternoon'
                                   ? 'bg-gradient-to-r from-sky-50 to-sky-100/70 dark:from-sky-900/20 dark:to-sky-800/20 border-l-4 border-sky-300 dark:border-sky-600'
                                   : 'bg-gradient-to-r from-violet-50 to-violet-100/70 dark:from-violet-900/20 dark:to-violet-800/20 border-l-4 border-violet-300 dark:border-violet-600'
                             }
                             hover:shadow-md transition-all duration-300 hover:scale-[1.01]
                             ${item.taskId !== 'free-time' ? 'cursor-pointer' : ''}`}
                      onClick={(e) => {
                        if (item.taskId !== 'free-time') {
                          e.stopPropagation();
                          openEditTaskModal(item.taskId);
                        }
                      }}
                      style={{
                        height: `${(item.duration / 15) * ((sleepTime - wakeTime) * 2) / ((sleepTime - wakeTime) / 15) * 0.8}px`,
                        minHeight: '100px'
                      }}
                    >
                      {/* Duration visual indicator */}
                      <div
                        className={`absolute left-0 top-0 w-1 sm:w-2 h-full ${
                          item.taskId === 'free-time'
                            ? 'bg-gray-300/50 dark:bg-gray-500/50'
                            : item.preferredTime === 'morning'
                              ? 'bg-amber-400 dark:bg-amber-500'
                              : item.preferredTime === 'afternoon'
                                ? 'bg-sky-400 dark:bg-sky-500'
                                : 'bg-violet-400 dark:bg-violet-500'
                        }`}
                      />

                      {/* Background color indicator based on time period */}
                      <div
                        className={`absolute left-1 sm:left-2 top-0 bottom-0 w-0.5 sm:w-1 ${
                          item.taskId === 'free-time'
                            ? 'bg-gray-200/50 dark:bg-gray-600/50'
                            : item.preferredTime === 'morning'
                              ? 'bg-amber-300/30 dark:bg-amber-600/30'
                              : item.preferredTime === 'afternoon'
                                ? 'bg-sky-300/30 dark:bg-sky-600/30'
                                : 'bg-violet-300/30 dark:bg-violet-600/30'
                        }`}
                      />

                      <div className="flex items-center justify-between gap-1.5 z-10 pl-2 sm:pl-3 w-full">
                        <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {item.startTime}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {item.endTime}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-1 z-10 pl-2 sm:pl-3 mt-1">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs sm:text-sm font-medium break-words pr-2 flex-1 text-gray-900 dark:text-white`}>
                              {item.taskName}
                              {item.taskId !== 'free-time' && (
                                <span className="text-[10px] sm:text-xs font-light ml-1 sm:ml-2 text-gray-500">
                                  ({item.preferredTime}
                                  {tasks.find(t => t.id === item.taskId)?.preferredStartTime &&
                                    ` @ ${tasks.find(t => t.id === item.taskId)?.preferredStartTime}`
                                  })
                                </span>
                              )}
                            </span>
                            {item.taskId !== 'free-time' && (
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1 mr-1 sm:mr-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustDuration(item.taskId, -15);
                                    }}
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                            bg-white dark:bg-gray-600 rounded-md shadow-sm
                                            hover:bg-gray-50 dark:hover:bg-gray-500
                                            transition-all duration-300 text-gray-700 dark:text-gray-300"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      shiftTaskEarlier(item.taskId);
                                    }}
                                    title="Shift 15 minutes earlier"
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                            bg-white dark:bg-gray-600 rounded-md shadow-sm
                                            hover:bg-gray-50 dark:hover:bg-gray-500
                                            transition-all duration-300 text-gray-700 dark:text-gray-300"
                                  >
                                    ↑
                                  </button>
                                  <span className="text-[10px] sm:text-xs font-medium text-transparent bg-clip-text
                                               bg-gradient-to-r from-indigo-600 to-violet-600
                                               dark:from-indigo-400 dark:to-violet-400 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                                    {item.duration}m
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      shiftTaskLater(item.taskId);
                                    }}
                                    title="Shift 15 minutes later"
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                            bg-white dark:bg-gray-600 rounded-md shadow-sm
                                            hover:bg-gray-50 dark:hover:bg-gray-500
                                            transition-all duration-300 text-gray-700 dark:text-gray-300"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustDuration(item.taskId, 15);
                                    }}
                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                            bg-white dark:bg-gray-600 rounded-md shadow-sm
                                            hover:bg-gray-50 dark:hover:bg-gray-500
                                            transition-all duration-300 text-gray-700 dark:text-gray-300"
                                  >
                                    +
                                  </button>
                                </div>
                                {item.taskId !== 'free-time' && (
                                  <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1 mr-1 sm:mr-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveTaskEarlier(item.taskId);
                                      }}
                                      title="Move earlier"
                                      className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                             bg-white dark:bg-gray-600 rounded-md shadow-sm
                                             hover:bg-gray-50 dark:hover:bg-gray-500
                                             transition-all duration-300 text-gray-700 dark:text-gray-300"
                                    >
                                      🌅
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveTaskLater(item.taskId);
                                      }}
                                      title="Move later"
                                      className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-medium
                                             bg-white dark:bg-gray-600 rounded-md shadow-sm
                                             hover:bg-gray-50 dark:hover:bg-gray-500
                                             transition-all duration-300 text-gray-700 dark:text-gray-300"
                                    >
                                      🌙
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const task = tasks.find(t => t.id === item.taskId);
                                    if (task) {
                                      // Remove from tasks state
                                      setTasks(tasks.filter(t => t.id !== item.taskId));

                                      // If it's a preset task, also remove from selectedQuickTasks
                                      const taskKey = `${task.text}-${task.duration}-${task.preferredTime}`;
                                      if (selectedQuickTasks.includes(taskKey)) {
                                        setSelectedQuickTasks(selectedQuickTasks.filter(t => t !== taskKey));
                                      }
                                    }
                                  }}
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1">
                            {item.completed && (
                              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full font-medium w-fit">
                                ✓ Done
                              </span>
                            )}
                            {/* Show task description if available */}
                            {item.taskId !== 'free-time' && tasks.find(t => t.id === item.taskId)?.description && (
                              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {tasks.find(t => t.id === item.taskId)?.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center flex-shrink-0">
              <button
                onClick={saveAsImage}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl
                         hover:from-indigo-600 hover:to-violet-600 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl
                         text-sm hover:scale-105 active:scale-95 flex items-center gap-3
                         border border-white/20 backdrop-blur-sm"
              >
                <span className="text-lg">✨</span> Save Your Daily Vibe
                <span className="text-lg">✨</span>
              </button>
            </div>
          </div>
        )}

        {/* Task Edit Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
               onClick={(e) => {
                 e.stopPropagation();
                 closeEditTaskModal();
               }}
               style={{ pointerEvents: 'auto' }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeEditTaskModal();
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Add details about this task..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeEditTaskModal();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEditedTask();
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600
                           text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

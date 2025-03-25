'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Coffee Time', duration: 60, preferredTime: 'morning' },
    { id: 2, text: 'Lunch', duration: 60, preferredTime: 'afternoon' },
    { id: 3, text: 'Dinner', duration: 60, preferredTime: 'evening' }
  ]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPreferredTime, setNewTaskPreferredTime] = useState('morning');
  const [wakeTime, setWakeTime] = useState(7 * 4); // 7:00 AM (in 15-min intervals)
  const [sleepTime, setSleepTime] = useState(22 * 4); // 10:00 PM (in 15-min intervals)
  const [isDragging, setIsDragging] = useState(null); // 'wake' or 'sleep'
  const [schedule, setSchedule] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const sliderRef = useRef(null);

  const timeOptions = ['morning', 'afternoon', 'evening'];

  const presetTasks = [
    { text: 'Coffee Time', duration: 60, preferredTime: 'morning' },
    { text: 'Lunch', duration: 60, preferredTime: 'afternoon' },
    { text: 'Dinner', duration: 60, preferredTime: 'evening' },
    { text: 'Read', duration: 30, preferredTime: 'morning' },
    { text: 'Gym', duration: 60, preferredTime: 'morning' },
    { text: 'Walk the dog', duration: 20, preferredTime: 'morning' },
    { text: 'Meditate', duration: 15, preferredTime: 'morning' },
    { text: 'Focus Time', duration: 120, preferredTime: 'morning' },
    { text: 'Study', duration: 120, preferredTime: 'afternoon' },
    { text: 'Cook', duration: 45, preferredTime: 'evening' },
    { text: 'Clean', duration: 60, preferredTime: 'afternoon' },
    { text: 'Shopping', duration: 90, preferredTime: 'afternoon' },
    { text: 'Call family', duration: 30, preferredTime: 'evening' }
  ];

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        duration: 30, // Default 30 minutes
        preferredTime: newTaskPreferredTime
      }]);
      setNewTask('');
      setNewTaskPreferredTime('morning'); // Reset to default
    }
  };

  const addPresetTask = (task) => {
    setTasks([...tasks, {
      id: Date.now(),
      text: task.text,
      duration: task.duration,
      preferredTime: task.preferredTime
    }]);
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

  const generateSchedule = () => {
    // Ensure wake time is always before sleep time
    if (wakeTime >= sleepTime) {
      setSchedule([]);
      setUnscheduledTasks(tasks);
      return;
    }

    // Convert wake/sleep times to time slots (15-min intervals)
    const totalSlots = Math.floor((sleepTime - wakeTime) / 4);
    const timeSlots = Array(totalSlots).fill(null);

    // Group tasks by preferred time for organization
    const tasksByTime = {
      morning: tasks.filter(task => task.preferredTime === 'morning'),
      afternoon: tasks.filter(task => task.preferredTime === 'afternoon'),
      evening: tasks.filter(task => task.preferredTime === 'evening')
    };

    // Define time ranges for each period (in slots from wake time)
    const timeRanges = {
      morning: { start: 0, end: Math.floor(totalSlots * 0.4) },
      afternoon: { start: Math.floor(totalSlots * 0.4), end: Math.floor(totalSlots * 0.7) },
      evening: { start: Math.floor(totalSlots * 0.7), end: totalSlots }
    };

    // Helper function to find available slots
    const findAvailableSlots = (startSlot, duration) => {
      const slotsNeeded = Math.ceil(duration / 15);

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

    // Track unscheduled tasks
    const unscheduled = [];

    // Schedule tasks for each time period
    Object.entries(tasksByTime).forEach(([period, periodTasks]) => {
      const range = timeRanges[period];

      periodTasks.forEach(task => {
        const slotsNeeded = Math.ceil(task.duration / 15);
        let startSlot = -1;

        // Try to find slots in the preferred time range
        startSlot = findAvailableSlots(range.start, task.duration);

        // If no slots found, try the entire day
        if (startSlot === -1) {
          startSlot = findAvailableSlots(0, task.duration);
        }

        // If we found a slot, schedule the task
        if (startSlot !== -1) {
          const startTimeMinutes = wakeTime + (startSlot * 4);
          // Convert task duration (in minutes) to quarter-hours correctly
          // In the time system: 1 hour = 4 quarter-hours, so 60 minutes = 4 units
          const endTimeMinutes = startTimeMinutes + Math.ceil(task.duration / 60 * 4);

          const taskObject = {
            taskId: task.id,
            taskName: task.text,
            duration: task.duration,
            preferredTime: task.preferredTime,
            startTime: formatTime(startTimeMinutes),
            endTime: formatTime(endTimeMinutes),
            completed: false,
            startSlot: startSlot,
            endSlot: startSlot + slotsNeeded
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
    setUnscheduledTasks(unscheduled);

    // Convert time slots to schedule array and fill gaps with free time
    const newSchedule = [];
    let currentFreeStart = null;

    // Process each time slot
    for (let i = 0; i < timeSlots.length; i++) {
      // If this is a free time slot
      if (timeSlots[i] === null) {
        if (currentFreeStart === null) {
          currentFreeStart = i;
        }

        // If this is the last slot, add the free time block
        if (i === timeSlots.length - 1 && currentFreeStart !== null) {
          const freeStartTime = wakeTime + (currentFreeStart * 4);
          const freeEndTime = wakeTime + ((i + 1) * 4);
          newSchedule.push({
            taskId: 'free-time',
            taskName: 'Free Time',
            duration: (i - currentFreeStart + 1) * 15,
            preferredTime: 'flexible',
            startTime: formatTime(freeStartTime),
            endTime: formatTime(freeEndTime),
            completed: false
          });
        }
      }
      // If this is a task slot
      else {
        // If we had free time before this, add it to schedule
        if (currentFreeStart !== null) {
          const freeStartTime = wakeTime + (currentFreeStart * 4);
          const freeEndTime = wakeTime + (i * 4);
          newSchedule.push({
            taskId: 'free-time',
            taskName: 'Free Time',
            duration: (i - currentFreeStart) * 15,
            preferredTime: 'flexible',
            startTime: formatTime(freeStartTime),
            endTime: formatTime(freeEndTime),
            completed: false
          });
          currentFreeStart = null;
        }

        // Add the task if it's the start of a new task
        if (i === 0 || timeSlots[i-1] === null || timeSlots[i-1].taskId !== timeSlots[i].taskId) {
          newSchedule.push(timeSlots[i]);
        }
      }
    }

    // Add final free time block if there's time until sleep
    const finalTime = wakeTime + (timeSlots.length * 4);
    if (finalTime < sleepTime) {
      newSchedule.push({
        taskId: 'free-time',
        taskName: 'Free Time',
        duration: Math.round((sleepTime - finalTime) / 4 * 15),
        preferredTime: 'flexible',
        startTime: formatTime(finalTime),
        endTime: formatTime(sleepTime),
        completed: false
      });
    }

    setSchedule(newSchedule);
  };

  // Add useEffect to regenerate schedule when tasks or time window changes
  useEffect(() => {
    generateSchedule();
  }, [tasks, wakeTime, sleepTime]);

  // Clear all tasks
  const clearAllTasks = () => {
    if (window.confirm('Are you sure you want to clear all tasks?')) {
      setTasks([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <header className="text-center mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-2">
            ✨ Daily Vibe Planner ✨
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Craft your perfect day's rhythm ✦ ✧ ✦
          </p>
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
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Show all ({presetTasks.length})
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presetTasks.slice(0, 8).map((task, index) => (
              <button
                key={index}
                onClick={() => addPresetTask(task)}
                className="px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-700 dark:text-gray-300
                         rounded-lg border border-gray-200/60 dark:border-gray-700/60 hover:bg-white
                         dark:hover:bg-gray-700 transition-all duration-300 text-xs
                         hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/40 active:scale-95"
              >
                {task.text} <span className="text-indigo-500 dark:text-indigo-400">({task.duration}m)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Task Input Form */}
        <form onSubmit={addTask} className="mb-5 sm:mb-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-md">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="✦ Add your next brilliant task..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50
                         bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm
                         transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg
                         hover:from-indigo-600 hover:to-violet-600 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm hover:shadow-md
                         text-sm hover:scale-105 active:scale-95"
              >
                Add ✦
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Time period:</label>
              <select
                value={newTaskPreferredTime}
                onChange={(e) => setNewTaskPreferredTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50
                         bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-xs
                         transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Task List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="text-lg">📝</span> Your Tasks ({tasks.length})
            </h2>
            {tasks.length > 0 && (
              <button
                onClick={clearAllTasks}
                className="text-xs text-red-500 dark:text-red-400 hover:underline">
                Clear All
              </button>
            )}
          </div>

          {/* Grid container for tasks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl
                          border border-gray-200/60 dark:border-gray-700/60 p-4 shadow-sm
                          hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700
                          transition-all duration-300`}
              >
                {/* Main Content */}
                <div className="space-y-3">
                  {/* Task Title and Delete */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {task.text}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTasks(tasks.filter(t => t.id !== task.id));
                      }}
                      className="ml-2 w-6 h-6 flex items-center justify-center rounded-lg
                                text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300
                                hover:bg-red-50 dark:hover:bg-red-900/20
                                transition-all duration-300 flex-shrink-0"
                      aria-label="Delete task"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Task Details */}
                  <div className="space-y-2">
                    {/* Time Settings */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Period:</span>
                      <select
                        value={task.preferredTime}
                        onChange={(e) => updatePreferredTime(task.id, e.target.value)}
                        className="flex-1 text-xs px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-700
                                text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600
                                focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer
                                transition-all duration-300"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>
                            {time.charAt(0).toUpperCase() + time.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duration Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Duration:</span>
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustDuration(task.id, -15);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-xs font-medium
                                  bg-white dark:bg-gray-600 rounded-md shadow-sm
                                  hover:bg-gray-50 dark:hover:bg-gray-500
                                  transition-all duration-300 text-gray-700 dark:text-gray-300"
                        >
                          -
                        </button>
                        <span className="text-xs font-medium text-transparent bg-clip-text
                                     bg-gradient-to-r from-indigo-600 to-violet-600
                                     dark:from-indigo-400 dark:to-violet-400 min-w-[2rem] text-center">
                          {task.duration}m
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustDuration(task.id, 15);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-xs font-medium
                                  bg-white dark:bg-gray-600 rounded-md shadow-sm
                                  hover:bg-gray-50 dark:hover:bg-gray-500
                                  transition-all duration-300 text-gray-700 dark:text-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8 text-sm sm:text-base bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">✦</span>
                <p>No tasks yet. Add your first brilliant task to begin!</p>
                <span className="text-2xl">✦</span>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Display */}
        {schedule.length > 0 && (
          <div className="mt-6 p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="text-lg">✦</span> Your Daily Schedule
              </h2>
              <button className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors">
                Share ↗
              </button>
            </div>

            {unscheduledTasks.length > 0 && (
              <div className="mb-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <span className="text-base sm:text-lg">⚠️</span>
                  <p className="text-xs sm:text-sm font-medium">
                    {unscheduledTasks.length} task{unscheduledTasks.length !== 1 ? 's' : ''} couldn't be scheduled:
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

            <div className="relative flex max-h-[800px] overflow-y-auto scrollbar-hide">
              <div className="space-y-2 sm:space-y-3 w-full">
                {schedule.map((item, index) => (
                  <div
                    key={`${item.taskId}-${index}`}
                    onClick={() => item.taskId !== 'free-time' && toggleTask(item.taskId)}
                    className={`relative flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 p-3 rounded-lg cursor-pointer overflow-hidden
                             ${item.taskId === 'free-time'
                               ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50'
                               : item.completed
                                 ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-l-4 border-emerald-400 dark:border-emerald-500'
                                 : item.preferredTime === 'morning'
                                   ? 'bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-900/20 dark:to-amber-800/20 border-l-4 border-amber-300 dark:border-amber-600'
                                   : item.preferredTime === 'afternoon'
                                     ? 'bg-gradient-to-r from-sky-50 to-sky-100/70 dark:from-sky-900/20 dark:to-sky-800/20 border-l-4 border-sky-300 dark:border-sky-600'
                                     : 'bg-gradient-to-r from-violet-50 to-violet-100/70 dark:from-violet-900/20 dark:to-violet-800/20 border-l-4 border-violet-300 dark:border-violet-600'
                             }
                             hover:shadow-md transition-all duration-300 hover:scale-[1.01]`}
                    style={{
                      height: `${Math.max(70, Math.min(item.duration * 0.3, 120))}px`
                    }}
                  >
                    {/* Duration visual indicator */}
                    <div
                      className={`absolute left-0 top-0 w-2 h-full ${
                        item.taskId === 'free-time'
                          ? 'bg-gray-300/50 dark:bg-gray-500/50'
                          : item.completed
                            ? 'bg-emerald-400 dark:bg-emerald-500'
                            : item.preferredTime === 'morning'
                              ? 'bg-amber-400 dark:bg-amber-500'
                              : item.preferredTime === 'afternoon'
                                ? 'bg-sky-400 dark:bg-sky-500'
                                : 'bg-violet-400 dark:bg-violet-500'
                      }`}
                    />

                    {/* Background color indicator based on time period */}
                    <div
                      className={`absolute left-2 top-0 bottom-0 w-1 ${
                        item.taskId === 'free-time'
                          ? 'bg-gray-200/50 dark:bg-gray-600/50'
                          : item.completed
                            ? 'bg-emerald-300/30 dark:bg-emerald-600/30'
                            : item.preferredTime === 'morning'
                              ? 'bg-amber-300/30 dark:bg-amber-600/30'
                              : item.preferredTime === 'afternoon'
                                ? 'bg-sky-300/30 dark:bg-sky-600/30'
                                : 'bg-violet-300/30 dark:bg-violet-600/30'
                      }`}
                    />

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3 z-10 pl-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[5rem] sm:min-w-[6rem]">
                        {item.startTime}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 flex-1">
                        <span className={`text-sm font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {item.taskName}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.completed && (
                            <span className="px-2 py-0.5 text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full font-medium w-fit">
                              ✓ Done
                            </span>
                          )}
                          {item.taskId !== 'free-time' && !item.completed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 w-fit">
                              {item.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-right text-gray-500 dark:text-gray-400 pt-1 sm:pt-0 z-10 pr-2">
                      {item.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>✦ {formatTime(wakeTime)}</span>
                <span>{calculateWakeDuration()} hours</span>
                <span>{formatTime(sleepTime)} ✦</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

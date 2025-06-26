import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { QuizSettings } from '../../services/quizService';

interface CreateQuizFormProps {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  loading: boolean;
  onTopicChange: (v: string) => void;
  onDifficultyChange: (v: 'easy' | 'medium' | 'hard') => void;
  onGenerate: () => void;
  onCancel: () => void;
  settings?: QuizSettings;
  onSettingsChange?: (settings: QuizSettings) => void;
}

const CreateQuizForm: React.FC<CreateQuizFormProps> = ({
  topic,
  difficulty,
  loading,
  onTopicChange,
  onDifficultyChange,
  onGenerate,
  onCancel,
  settings,
  onSettingsChange
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  
  // Local state for input values to allow empty strings during editing
  const [inputValues, setInputValues] = React.useState({
    numberOfQuestions: settings?.numberOfQuestions?.toString() || '5',
    numberOfChoices: settings?.numberOfChoices?.toString() || '4'
  });

  // Update local state when settings change from parent
  React.useEffect(() => {
    if (settings) {
      setInputValues({
        numberOfQuestions: settings.numberOfQuestions.toString(),
        numberOfChoices: settings.numberOfChoices.toString()
      });
    }
  }, [settings]);

  const handleSettingsChange = (newSettings: Partial<QuizSettings>) => {
    if (settings && onSettingsChange) {
      onSettingsChange({ ...settings, ...newSettings });
    }
  };

  const handleQuestionTypeChange = (type: keyof QuizSettings['questionTypes'], value: boolean) => {
    if (settings && onSettingsChange) {
      onSettingsChange({
        ...settings,
        questionTypes: {
          ...settings.questionTypes,
          [type]: value
        }
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-primary-100 rounded-xl shadow-lg border border-primary-200 p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 pointer-events-none"></div>
      <div className="relative">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generate New Quiz</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={e => onTopicChange(e.target.value)}
                placeholder="e.g., Mathematics, Physics, History"
                className="input-field bg-white/80 backdrop-blur-sm border-primary-200 focus:border-primary-400 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={e => onDifficultyChange(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="input-field appearance-none pr-10 bg-white/80 backdrop-blur-sm border-primary-200 focus:border-primary-400 focus:ring-primary-200"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {settings && onSettingsChange && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium mb-3"
              >
                <Settings className="w-4 h-4 mr-1" />
                Advanced Settings
                <svg 
                  className={`w-4 h-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAdvanced && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-primary-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="15"
                        value={inputValues.numberOfQuestions}
                        onChange={e => {
                          const value = e.target.value;
                          setInputValues(prev => ({ ...prev, numberOfQuestions: value }));
                          
                          // Only update settings if it's a valid number
                          const num = parseInt(value);
                          if (!isNaN(num) && num >= 3 && num <= 15) {
                            handleSettingsChange({ numberOfQuestions: num });
                          }
                        }}
                        onBlur={e => {
                          const value = e.target.value;
                          const num = parseInt(value);
                          if (isNaN(num) || num < 3 || num > 15) {
                            // Reset to default if invalid
                            setInputValues(prev => ({ ...prev, numberOfQuestions: '5' }));
                            handleSettingsChange({ numberOfQuestions: 5 });
                          }
                        }}
                        className="input-field bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choices per Question
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="6"
                        value={inputValues.numberOfChoices}
                        onChange={e => {
                          const value = e.target.value;
                          setInputValues(prev => ({ ...prev, numberOfChoices: value }));
                          
                          // Only update settings if it's a valid number
                          const num = parseInt(value);
                          if (!isNaN(num) && num >= 2 && num <= 6) {
                            handleSettingsChange({ numberOfChoices: num });
                          }
                        }}
                        onBlur={e => {
                          const value = e.target.value;
                          const num = parseInt(value);
                          if (isNaN(num) || num < 2 || num > 6) {
                            // Reset to default if invalid
                            setInputValues(prev => ({ ...prev, numberOfChoices: '4' }));
                            handleSettingsChange({ numberOfChoices: 4 });
                          }
                        }}
                        className="input-field bg-white border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Question Types
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.questionTypes.multipleChoice}
                          onChange={e => handleQuestionTypeChange('multipleChoice', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Multiple Choice</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.questionTypes.trueFalse}
                          onChange={e => handleQuestionTypeChange('trueFalse', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">True/False</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.questionTypes.openEnded}
                          onChange={e => handleQuestionTypeChange('openEnded', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Open-Ended</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              onClick={onGenerate}
              disabled={!topic.trim() || loading}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizForm;
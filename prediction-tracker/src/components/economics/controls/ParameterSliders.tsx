'use client';

import { useState } from 'react';
import { EconomicParams } from '@/types/economics/economic';

interface ParameterSlidersProps {
  parameters: EconomicParams;
  onChange: (params: EconomicParams) => void;
}

export default function ParameterSliders({ parameters, onChange }: ParameterSlidersProps) {
  const updateParameter = (path: string, value: number | string) => {
    const keys = path.split('.');
    const newParams = { ...parameters };
    
    let current: Record<string, unknown> = newParams as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) current[keys[i]] = {};
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    
    onChange(newParams);
  };

  const SliderGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="parameter-panel">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
      <div className="relative inline-block">
        <div 
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {children}
        </div>
        {isVisible && (
          <div className="absolute z-10 w-64 p-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
            {content}
            <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  const Slider = ({ 
    label, 
    path, 
    min, 
    max, 
    step = 1, 
    suffix = '',
    value,
    tooltip
  }: { 
    label: string; 
    path: string; 
    min: number; 
    max: number; 
    step?: number; 
    suffix?: string;
    value: number;
    tooltip: string;
  }) => (
    <div className="slider-container">
      <div className="slider-label">
        <div className="flex items-center space-x-2">
          <span>{label}</span>
          <Tooltip content={tooltip}>
            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center cursor-help text-xs text-gray-600">
              ?
            </div>
          </Tooltip>
        </div>
        <span className="font-mono text-sm">
          {value.toFixed(step < 1 ? 2 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateParameter(path, parseFloat(e.target.value))}
        className="slider-input"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <SliderGroup title="AI Impact">
        <Slider
          label="AI Productivity Gain"
          path="aiProductivityGain"
          min={0}
          max={200}
          suffix="%"
          value={parameters.aiProductivityGain}
          tooltip="Percentage increase in developer productivity due to AI coding assistants. Current estimates suggest 20-40% gains from tools like GitHub Copilot, with potential for higher gains as AI improves."
        />
      </SliderGroup>

      <SliderGroup title="AI Substitution by Role">
        <Slider
          label="Junior Developers"
          path="aiSubstitutionByRole.juniorDev"
          min={0}
          max={80}
          suffix="%"
          value={parameters.aiSubstitutionByRole.juniorDev}
          tooltip="Percentage of junior developer tasks that could be automated by AI by 2030. Junior roles are most vulnerable due to routine coding tasks that AI can already perform well."
        />
        <Slider
          label="Mid-level Developers"
          path="aiSubstitutionByRole.midDev"
          min={0}
          max={60}
          suffix="%"
          value={parameters.aiSubstitutionByRole.midDev}
          tooltip="Percentage of mid-level developer tasks automatable by AI. These roles involve more complex problem-solving and system design, making them less vulnerable than junior positions."
        />
        <Slider
          label="Senior Developers"
          path="aiSubstitutionByRole.seniorDev"
          min={0}
          max={40}
          suffix="%"
          value={parameters.aiSubstitutionByRole.seniorDev}
          tooltip="Percentage of senior developer tasks automatable by AI. Senior roles involve high-level architecture, mentoring, and complex problem-solving that AI struggles with."
        />
        <Slider
          label="Architects"
          path="aiSubstitutionByRole.architect"
          min={0}
          max={20}
          suffix="%"
          value={parameters.aiSubstitutionByRole.architect}
          tooltip="Percentage of software architect tasks automatable by AI. Architecture requires deep system understanding, business context, and strategic thinking that remain largely human domains."
        />
        <Slider
          label="DevOps Engineers"
          path="aiSubstitutionByRole.devOps"
          min={0}
          max={50}
          suffix="%"
          value={parameters.aiSubstitutionByRole.devOps}
          tooltip="Percentage of DevOps tasks automatable by AI. Many infrastructure and deployment tasks are already automated, with AI potentially accelerating this trend."
        />
        <Slider
          label="Frontend Developers"
          path="aiSubstitutionByRole.frontend"
          min={0}
          max={70}
          suffix="%"
          value={parameters.aiSubstitutionByRole.frontend}
          tooltip="Percentage of frontend developer tasks automatable by AI. UI generation and styling are areas where AI shows strong capabilities, but user experience design remains challenging."
        />
        <Slider
          label="Backend Developers"
          path="aiSubstitutionByRole.backend"
          min={0}
          max={40}
          suffix="%"
          value={parameters.aiSubstitutionByRole.backend}
          tooltip="Percentage of backend developer tasks automatable by AI. Backend development involves complex system design, performance optimization, and security considerations that limit AI substitution."
        />
        <Slider
          label="Full-stack Developers"
          path="aiSubstitutionByRole.fullStack"
          min={0}
          max={50}
          suffix="%"
          value={parameters.aiSubstitutionByRole.fullStack}
          tooltip="Percentage of full-stack developer tasks automatable by AI. These roles combine frontend and backend skills, with vulnerability varying by the specific mix of responsibilities."
        />
        <Slider
          label="Mobile Developers"
          path="aiSubstitutionByRole.mobile"
          min={0}
          max={60}
          suffix="%"
          value={parameters.aiSubstitutionByRole.mobile}
          tooltip="Percentage of mobile developer tasks automatable by AI. Mobile development has many standardized patterns that AI can learn, but platform-specific optimizations and UX remain challenging."
        />
        <Slider
          label="Data Scientists"
          path="aiSubstitutionByRole.dataScience"
          min={-20}
          max={30}
          suffix="%"
          value={parameters.aiSubstitutionByRole.dataScience}
          tooltip="Net change in data scientist demand. Negative values indicate job growth as AI creates more demand for ML expertise. Current trends suggest strong growth in AI/ML roles despite automation."
        />
      </SliderGroup>

      <SliderGroup title="New AI-Complementary Roles">
        <Slider
          label="Prompt Engineering"
          path="aiComplementaryRoles.promptEngineering"
          min={0}
          max={20000}
          step={1000}
          value={parameters.aiComplementaryRoles.promptEngineering}
          tooltip="Number of new prompt engineering jobs created. These roles involve designing and optimizing AI prompts for various applications. Currently a rapidly growing field."
        />
        <Slider
          label="AI Systems Integration"
          path="aiComplementaryRoles.aiSystemsIntegration"
          min={0}
          max={25000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiSystemsIntegration}
          tooltip="Number of jobs focused on integrating AI systems into existing software infrastructure. High demand as companies adopt AI tools and need integration expertise."
        />
        <Slider
          label="AI Ethics & Compliance"
          path="aiComplementaryRoles.aiEthicsCompliance"
          min={0}
          max={15000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiEthicsCompliance}
          tooltip="Number of roles ensuring AI systems comply with regulations and ethical guidelines. Growing importance as AI regulation increases globally."
        />
        <Slider
          label="Human-AI Interface"
          path="aiComplementaryRoles.humanAiInterface"
          min={0}
          max={15000}
          step={1000}
          value={parameters.aiComplementaryRoles.humanAiInterface}
          tooltip="Number of roles designing interfaces between humans and AI systems. Focuses on user experience, workflow optimization, and human-AI collaboration."
        />
        <Slider
          label="AI Training & Tuning"
          path="aiComplementaryRoles.aiTraining"
          min={0}
          max={20000}
          step={1000}
          value={parameters.aiComplementaryRoles.aiTraining}
          tooltip="Number of roles focused on training, fine-tuning, and maintaining AI models. Includes MLOps, model optimization, and custom AI development."
        />
      </SliderGroup>

      <SliderGroup title="Economic Environment">
        <Slider
          label="GDP Growth Rate"
          path="gdpGrowth"
          min={-2}
          max={6}
          step={0.1}
          suffix="%"
          value={parameters.gdpGrowth}
          tooltip="Annual GDP growth rate. Higher growth typically increases demand for technology workers. Current US GDP growth averages 2-3% annually."
        />
        <Slider
          label="Interest Rates"
          path="interestRates"
          min={0}
          max={10}
          step={0.1}
          suffix="%"
          value={parameters.interestRates}
          tooltip="Federal Reserve interest rates. Higher rates reduce VC funding and tech hiring. Current rates around 4-5% after recent increases to combat inflation."
        />
        <Slider
          label="VC Availability"
          path="ventureCapitalAvailability"
          min={0.2}
          max={2.0}
          step={0.1}
          suffix="x"
          value={parameters.ventureCapitalAvailability}
          tooltip="Venture capital funding relative to baseline. Tech hiring strongly correlates with VC investment. 1.0x = normal levels, 2.0x = boom, 0.5x = downturn."
        />
        <Slider
          label="Wage Elasticity"
          path="wageElasticity"
          min={-0.8}
          max={-0.2}
          step={0.05}
          value={parameters.wageElasticity}
          tooltip="How responsive wages are to supply/demand changes. Values closer to -0.8 mean wages are more sensitive to market conditions. Economics literature suggests -0.3 to -0.6 for tech workers."
        />
        <Slider
          label="Geographic Arbitrage"
          path="geographicArbitrage"
          min={0}
          max={0.5}
          step={0.05}
          suffix="%"
          value={parameters.geographicArbitrage}
          tooltip="Wage reduction due to remote work and global talent access. Higher values mean more ability to hire globally at lower costs. COVID accelerated this trend significantly."
        />
      </SliderGroup>

      <SliderGroup title="Education Pipeline">
        <Slider
          label="Graduation Rate Growth"
          path="educationPipeline.graduationRate"
          min={-0.05}
          max={0.15}
          step={0.01}
          suffix=""
          value={parameters.educationPipeline.graduationRate}
          tooltip="Annual change in CS/engineering graduation rates. Positive values mean more graduates entering the market each year. Current trends show modest growth in CS programs."
        />
        <Slider
          label="Bootcamp Growth"
          path="educationPipeline.bootcampGrowth"
          min={0}
          max={0.3}
          step={0.01}
          suffix=""
          value={parameters.educationPipeline.bootcampGrowth}
          tooltip="Annual growth rate of coding bootcamp graduates. These programs provide faster paths to entry-level positions. Growth has slowed from pandemic peaks but remains positive."
        />
        <Slider
          label="University Capacity"
          path="educationPipeline.universityCapacity"
          min={0.5}
          max={2.0}
          step={0.1}
          suffix="x"
          value={parameters.educationPipeline.universityCapacity}
          tooltip="University capacity for CS programs relative to current levels. Many programs are at capacity with waitlists. Expansion requires faculty hiring and facility investment."
        />
        <Slider
          label="Skills Training Adoption"
          path="educationPipeline.skillsTrainingAdoption"
          min={0}
          max={1}
          step={0.05}
          suffix=""
          value={parameters.educationPipeline.skillsTrainingAdoption}
          tooltip="Adoption rate of continuous learning and reskilling programs. Higher values mean workers adapt faster to new technologies and AI tools. Critical for career longevity."
        />
      </SliderGroup>
    </div>
  );
}
import React, { forwardRef } from 'react';
import { motion, type MotionProps } from 'framer-motion';

// --- Button ---
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & MotionProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, children, ...props }, ref) => {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" }}
      whileTap={{ scale: 0.95, y: 0, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.15)" }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`px-4 py-2 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-primary-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </motion.button>
  );
});

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={`w-full px-4 py-3 bg-surface-light text-text rounded-2xl border border-transparent focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary transition-shadow duration-300 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
    return (
        <select
            className={`w-full px-4 py-3 bg-surface-light text-text rounded-2xl border border-transparent focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-shadow duration-300 ${className}`}
            ref={ref}
            {...props}
        >
            {children}
        </select>
    );
});


// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isPressable?: boolean;
}
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, isPressable, ...props }, ref) => {
  const hoverEffect = isPressable ? {
    y: -5,
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.25)",
  } : {};
  
  const tapEffect = isPressable ? { scale: 0.97 } : {};

  return (
    <motion.div
      whileHover={hoverEffect}
      whileTap={tapEffect}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-surface p-6 rounded-3xl shadow-lg border border-white/5 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </motion.div>
  );
});

// --- Dialog ---
interface DialogProps {
  isOpen: boolean;
  children: React.ReactNode;
}
export const Dialog: React.FC<DialogProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-background rounded-4xl shadow-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
};
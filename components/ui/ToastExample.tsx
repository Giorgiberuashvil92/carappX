import React from 'react';
import { View, StyleSheet } from 'react-native';
import Button from './Button';
import { useToast } from '../../contexts/ToastContext';

const ToastExample: React.FC = () => {
  const { success, error, warning, info } = useToast();

  const handleSuccess = () => {
    success('წარმატება!', 'ოპერაცია წარმატებით დასრულდა', 3000);
  };

  const handleError = () => {
    error('შეცდომა!', 'რაღაც შეცდომა მოხდა, სცადეთ თავიდან', 4000);
  };

  const handleWarning = () => {
    warning('გაფრთხილება!', 'გთხოვთ, ყურადღებით წაიკითხოთ', 3500);
  };

  const handleInfo = () => {
    info('ინფორმაცია', 'ეს არის სასარგებლო ინფორმაცია', 3000);
  };

  return (
    <View style={styles.container}>
      <Button
        title="წარმატება Toast"
        onPress={handleSuccess}
        icon="check-circle"
        variant="black"
        style={styles.button}
      />
      
      <Button
        title="შეცდომა Toast"
        onPress={handleError}
        icon="x-circle"
        variant="outline"
        style={styles.button}
      />
      
      <Button
        title="გაფრთხილება Toast"
        onPress={handleWarning}
        icon="alert-triangle"
        variant="outline"
        style={styles.button}
      />
      
      <Button
        title="ინფორმაცია Toast"
        onPress={handleInfo}
        icon="info"
        variant="ghost"
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  button: {
    marginBottom: 8,
  },
});

export default ToastExample;

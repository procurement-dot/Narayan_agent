import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useNavigationStore } from '../features/navigation/navigation.store';

export default function EmailRoute() {
  useEffect(() => {
    useNavigationStore.getState().navigate('email');
  }, []);

  return <Redirect href="/" />;
}

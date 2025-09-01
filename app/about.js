/**
 * About & Help Screen - App information, support, and FAQ
 * 
 * Purpose: Version info, contact details, help resources, and app policies
 * Extends: Add in-app tutorials, video guides, community forum links
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FAQ_ITEMS = [
  {
    question: 'How accurate are the calorie calculations?',
    answer: 'Our database uses verified nutrition data from USDA and other reliable sources. However, individual food items may vary, so use as a general guide.',
  },
  {
    question: 'Can I use the app offline?',
    answer: 'Yes! All your data is stored locally on your device. You can log meals and view your history without an internet connection.',
  },
  {
    question: 'How does the meal scan feature work?',
    answer: 'Meal scan uses AI to analyze photos and estimate nutritional content. Results are approximations and should be manually verified for accuracy.',
  },
  {
    question: 'How do I change my daily calorie goal?',
    answer: 'Go to Profile > Daily Goals and tap Edit. You can manually adjust your goal or recalculate based on updated body metrics.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes! All your data stays on your device and is never shared without your consent. We prioritize user privacy and data security.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to reach us:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@quickkcal.com'),
        },
        {
          text: 'Website',
          onPress: () => Linking.openURL('https://quickkcal.com/support'),
        },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate QuickKcal',
      'Love the app? Please rate us on the App Store!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => console.log('Open app store') },
      ]
    );
  };

  const renderFAQItem = (item, index) => (
    <View key={index} style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{item.question}</Text>
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* App Info */}
      <View style={styles.section}>
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <Ionicons name="nutrition" size={40} color="#4CAF50" />
          </View>
          <View>
            <Text style={styles.appName}>QuickKcal</Text>
            <Text style={styles.appTagline}>Log any meal in 10 seconds</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>
        
        <Text style={styles.appDescription}>
          QuickKcal helps busy people track their food intake quickly and efficiently. 
          Our goal is to make calorie counting simple and stress-free, so you can focus 
          on reaching your health and fitness goals.
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get Help</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color="#4CAF50" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Contact Support</Text>
            <Text style={styles.actionDescription}>Get help with issues or questions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleRateApp}>
          <Ionicons name="star-outline" size={24} color="#4CAF50" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Rate the App</Text>
            <Text style={styles.actionDescription}>Help us improve QuickKcal</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#4CAF50" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Send Feedback</Text>
            <Text style={styles.actionDescription}>Share suggestions or report bugs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="document-text-outline" size={24} color="#4CAF50" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>User Guide</Text>
            <Text style={styles.actionDescription}>Learn how to use all features</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_ITEMS.map(renderFAQItem)}
      </View>

      {/* Legal & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Privacy</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="shield-outline" size={24} color="#666" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Privacy Policy</Text>
            <Text style={styles.actionDescription}>How we protect your data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="document-outline" size={24} color="#666" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Terms of Service</Text>
            <Text style={styles.actionDescription}>Usage terms and conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="information-outline" size={24} color="#666" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Open Source Licenses</Text>
            <Text style={styles.actionDescription}>Third-party software credits</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* App Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>500K+</Text>
            <Text style={styles.statLabel}>Foods in Database</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{'< 5s'}</Text>
            <Text style={styles.statLabel}>Avg. Log Time</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2 APIs</Text>
            <Text style={styles.statLabel}>Data Sources</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Ads or Premium</Text>
          </View>
        </View>
        
        <View style={styles.dataSourcesInfo}>
          <Text style={styles.dataSourcesTitle}>Data Sources</Text>
          <Text style={styles.dataSourcesText}>
            • Open Food Facts (OFF) - Global packaged food database{'\n'}
            • USDA FoodData Central (FDC) - Comprehensive nutrition database{'\n'}
            • All nutrition data standardized to per 100g format
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for people who want to eat better
        </Text>
        <Text style={styles.copyright}>
          © 2024 QuickKcal. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 20,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8fff8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  appTagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  dataSourcesInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dataSourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dataSourcesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
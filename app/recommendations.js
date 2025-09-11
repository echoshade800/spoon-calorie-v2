/**
 * How We Make Recommendations Screen - Evidence-based methodology explanation
 * 
 * Purpose: Explain the scientific basis behind Cal's recommendations and calculations
 * Features: Formatted article content, scrollable text, professional presentation
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecommendationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLinkPress = (url) => {
    // In a real app, would open external links
    console.log('Opening link:', url);
    // Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>How We Make Recommendations</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.bodyText}>
            At Cal, our mission is to help you reach your health and fitness goals with tools and guidance backed by evidence. Our calorie calculations and nutrition recommendations are grounded in established research, and our process has been reviewed by nutrition and health professionals.
          </Text>
          
          <Text style={styles.bodyText}>
            We continuously improve our recommendations as new evidence emerges. You should always consult with a physician or medical professional before starting any diet, exercise, or wellness program. The information provided here is not medical advice and should not replace medical consultation, diagnosis, or treatment.
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {/* 1. Registration and Setup */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>1. Registration and Setup</Text>
            
            <Text style={styles.bodyText}>
              During setup, we use your height, weight, age, sex, activity level, and goal (lose, maintain, or gain weight) to estimate your daily calorie needs.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Weight assessment and BMI:</Text> Centers for Disease Control and Prevention, StatPearls, and NIH guidelines.
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Resting metabolic rate (RMR) equations:</Text> Frankenfield et al., J Am Diet Assoc.
              </Text>
            </View>
          </View>

          {/* 2. Food Tracking and Benefits */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>2. Food Tracking and Benefits</Text>
            
            <Text style={styles.bodyText}>
              Research shows that logging meals improves awareness and supports sustainable weight management.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Effect of tracking on weight loss:</Text> Ingels JS et al., J Diabetes Res. 2017.
              </Text>
            </View>
          </View>

          {/* 3. Exercise and Activity */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>3. Exercise and Activity</Text>
            
            <Text style={styles.bodyText}>
              Physical activity boosts energy expenditure and overall health.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Protein and exercise:</Text> International Society of Sports Nutrition.
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Benefits of activity:</Text> CDC and Diabetologia (Thyfault JP).
              </Text>
            </View>
          </View>

          {/* 4. Weight Goals and Strategies */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>4. Weight Goals and Strategies</Text>
            
            <Text style={styles.bodyText}>
              Setting clear, measurable goals helps long-term success.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Mindfulness and self-compassion:</Text> Mantzios M et al., Psychol Health.
              </Text>
            </View>
          </View>

          {/* 5. Stress and Lifestyle Factors */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>5. Stress and Lifestyle Factors</Text>
            
            <Text style={styles.bodyText}>
              Stress, sleep, and recovery impact metabolism and appetite.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Stress and body function:</Text> Yaribeygi H et al., EXCLI Journal.
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Exercise and cortisol/sleep:</Text> De Nys L et al., Psychoneuroendocrinology.
              </Text>
            </View>
          </View>

          {/* 6. Nutrients and Dietary Approaches */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>6. Nutrients and Dietary Approaches</Text>
            
            <Text style={styles.bodyText}>
              We reference scientific guidelines when suggesting macronutrient splits (carbs, protein, fat) or dietary approaches.
            </Text>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Protein and satiety:</Text> Paddon-Jones D et al., Am J Clin Nutr.
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Dietary Guidelines for Americans:</Text> USDA & HHS.
              </Text>
            </View>
            
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Fat and cardiovascular health:</Text> Maki KC, J Clin Lipidol.
              </Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <Text style={styles.bodyText}>
            Cal's recommendations combine your personal data with evidence-based nutrition and exercise science. Our goal is to provide realistic, safe, and effective guidance for your calorie targets, macronutrient goals, and overall wellness.
          </Text>
        </View>

        {/* Footer Notice */}
        <View style={styles.footerSection}>
          <Text style={styles.footerNotice}>
            ℹ️ Remember: Always seek professional medical advice for individual conditions or treatments.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    lineHeight: 28,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '600',
    color: '#000',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bulletText: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    lineHeight: 24,
  },
  bulletContent: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  footerSection: {
    backgroundColor: '#F8FFF8',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerNotice: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
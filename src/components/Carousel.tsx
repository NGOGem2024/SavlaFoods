import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

// For React Native CLI, you'll need to manually link these assets
const carouselData = [
  { id: '3', image: require('../assets/Carousel/c5.jpg') },
  { id: '1', image: require('../assets/Carousel/c4.jpg') },
  { id: '2', image: require('../assets/Carousel/s3.png') },
];

const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex === carouselData.length - 1) {
        setCurrentIndex(0);
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      } else {
        setCurrentIndex(currentIndex + 1);
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const renderCarouselItem = ({ item }: { item: { id: string; image: any } }) => {
    return (
      <View style={styles.carouselItemContainer}>
        <Image source={item.image} style={styles.carouselImage} />
      </View>
    );
  };

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={carouselData}
        renderItem={renderCarouselItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.floor(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    height: 170,
    marginBottom: 10,
  },
  carouselItemContainer: {
    width,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width - 20,
    height: 160,
    resizeMode: 'cover',
    borderRadius: 10,
  },
});

export default Carousel;






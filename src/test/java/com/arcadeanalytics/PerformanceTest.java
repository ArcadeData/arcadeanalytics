package com.arcadeanalytics;

/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

import java.util.Arrays;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class PerformanceTest {
  public static void main(String[] argv) {

    performanceTest();

  }

  private static void performanceTest() {

    // convert array to list

    final List<String> list = createArray();

    long accu = 0;
    final int iterations = 20;
    for (int i = 0; i < iterations; i++) {
      accu += perfIterator(list);
    }


    accu = 0;
    for (int i = 0; i < iterations; i++) {
      accu += perfIterator(list);
    }

    System.out.println("iterator mean = " + accu / iterations);

    accu = 0;
    for (int i = 0; i < iterations; i++) {
      accu += perfForLoop(list);
    }
    System.out.println("for loop mean = " + accu / iterations);

    accu = 0;
    for (int i = 0; i < iterations; i++) {
      accu += perfWhileLoop(list);
    }
    System.out.println("while loop mean = " + accu / iterations);

    accu = 0;
    for (int i = 0; i < iterations; i++) {
      accu += perfForEach(list);
    }
    System.out.println("for each loop mean = " + accu / iterations);

    accu = 0;
    for (int i = 0; i < iterations; i++) {
      accu += perfForEachLambda(list);
    }
    System.out.println("for each lambda = " + accu / iterations);

  }

  private static long perfForEach(List<String> lList) {

//        System.out.println("\n--------- For each java 7 Loop -------\n");
    long lWhileStartTime = new Date().getTime();
//        System.out.println("Start: " + lWhileStartTime);

    AtomicInteger counter = new AtomicInteger(0);
    for (String stemp : lList) {
      counter.incrementAndGet();
    }
    long lWhileEndTime = new Date().getTime();
        System.out.println("End: " + lWhileEndTime+counter);

    long lWhileDifference = lWhileEndTime - lWhileStartTime;
//        System.out.println("For each java 7e - Elapsed time in milliseconds: "         + lWhileDifference);

//        System.out.println("\n-------END-------");
    return lWhileDifference;

  }

  private static long perfForEachLambda(List<String> lList) {

//        System.out.println("\n--------- For each lambda Loop -------\n");
    long lWhileStartTime = new Date().getTime();
//        System.out.println("Start: " + lWhileStartTime);

    AtomicInteger counter = new AtomicInteger(0);
    lList.stream().forEach(s -> {
      counter.incrementAndGet();
    });

    long lWhileEndTime = new Date().getTime();
        System.out.println("End: " + lWhileEndTime+ " - " + counter);

    long lWhileDifference = lWhileEndTime - lWhileStartTime;
//        System.out.println("For each java 7e - Elapsed time in milliseconds: " + lWhileDifference);

//        System.out.println("\n-------END-------");
    return lWhileDifference;

  }

  private static long perfWhileLoop(List<String> lList) {
//        System.out.println("\n--------- While Loop -------\n");
    long lWhileStartTime = new Date().getTime();
//        System.out.println("Start: " + lWhileStartTime);

    // while loop
    AtomicInteger counter = new AtomicInteger(0);
    int j = 0;
    while (j < lList.size()) {
      String stemp = lList.get(j);
      j++;
      counter.incrementAndGet();
    }
    long lWhileEndTime = new Date().getTime();
        System.out.println("End: " + lWhileEndTime+ " - " + counter);

    long lWhileDifference = lWhileEndTime - lWhileStartTime;
//        System.out.println("While - Elapsed time in milliseconds: " + lWhileDifference);

//        System.out.println("\n-------END-------");

    return lWhileDifference;
  }

  private static long perfForLoop(List<String> lList) {
//        System.out.println("\n--------- For Loop --------\n");
    long lForStartTime = new Date().getTime();
//        System.out.println("Start: " + lForStartTime);

    // for loop
    AtomicInteger counter = new AtomicInteger(0);
    for (int i = 0; i < lList.size(); i++) {
      String stemp = lList.get(i);
      counter.incrementAndGet();
    }

    long lForEndTime = new Date().getTime();
        System.out.println("End: " + lForEndTime+ " - " + counter);

    long lForDifference = lForEndTime - lForStartTime;
//        System.out.println("For - Elapsed time in milliseconds: " + lForDifference);

//        System.out.println("\n-------END-------");
    return lForDifference;
  }

  private static long perfIterator(List lList) {
//        System.out.println("\n--------- Iterator Loop -------\n");
    long lIteratorStartTime = new Date().getTime();
//        System.out.println("Start: " + lIteratorStartTime);

    // iterator loop
    Iterator<String> iterator = lList.iterator();
    AtomicInteger counter = new AtomicInteger(0);
    while (iterator.hasNext()) {
      String stemp = iterator.next();
      counter.incrementAndGet();
    }
    long lIteratorEndTime = new Date().getTime();
    System.out.println("End: " + lIteratorEndTime + " - " + counter);

    long lIteratorDifference = lIteratorEndTime - lIteratorStartTime;
//        System.out.println("Iterator - Elapsed time in milliseconds: " + lIteratorDifference);

//        System.out.println("\n-------END-------");
    return lIteratorDifference;
  }

  static List<String> createArray() {

    String sArray[] = new String[15000000];

    for (int i = 0; i < 15000000; i++)
      sArray[i] = "Array " + i;

    return Arrays.asList(sArray);
  }
}

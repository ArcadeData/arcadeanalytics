package com.arcadeanalytics.index;

import com.arcadeanalytics.data.Sprite;

public interface SpriteProcessor {

    void process(Sprite document);

    void flush();

    long processed();
}

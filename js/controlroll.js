class ControlRoll extends GuiComponent {
    constructor(options) {
        super(options);
        this.beatWidth = getValueOrDefault(options, "beatWidth", 50);
        this.slotsPerBeat = getValueOrDefault(options, "slotsPerBeat", 32);
        this.beatLengthRange = getValueOrDefault(options, "beatLengthRange", [1, 1]);
        this.harmony = getValueOrDefault(options, "harmony", new ConstantHarmonicRythm([new ConstantHarmonyElement()]));
        this.slotData = getValueOrDefault(options, "slotData", null);
        this.autoControlLimits = getValueOrDefault(options, "autoControlLimits", true);
        this.controlLimits = getValueOrDefault(options, "controlLimits", [-1, 1]); // Only used for double and integer
        this.paddingLeft = getValueOrDefault(options, "paddingLeft", 60);
        this.updateControlLimits();
        this.updateSize();
    }
    updateControlLimits() {
        if (this.autoControlLimits && this.slotData != null) {
            const minLimit = -1;
            const maxLimit = 1;
            this.controlLimits = [minLimit, maxLimit];
        }
        else if (this.renderData == null) {
            this.noteLimits = [-1, 1];
        }
        else {
            // Just keep the current limits
        }
    }
    getHeaderHeight() {
        return 0;
    }
    getFooterHeight() {
        return 0;
    }
    getControlRowsWidth() {
        const ches = this.harmony.getConstantHarmonyElements();
        let harmonyWidth = 0;

        for (const e of ches) {
            const beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
            harmonyWidth += beats * this.beatWidth;
        }

        //    var dataWidth = 0;
        //    if (this.renderData) {
        //        var limits = this.renderData.getTimeLimits();
        //        dataWidth = Math.ceil(limits[1] * this.beatWidth);
        //    }
        return Math.max(harmonyWidth, dataWidth);
    }
    updateSize() {
        this.updateControlLimits();
        if (this.autoWidth) {
            let sum = 0;
            if (this.showKeys) {
                sum += this.keysWidth;
            }
            sum += this.getNoteRowsWidth();
            this.width = sum;
        }
        if (this.autoHeight) {
            let sum = 0;
            // Calculate header height
            // Calculate note rows height
            const rows = this.noteLimits[1] - this.noteLimits[0] + 1;
            sum += this.noteRowHeight * rows;
            // Calculate footer height
            this.height = sum;
        }
    }
    paintRows(x, y, context) {
        const startNote = this.noteLimits[0];
        const endNote = this.noteLimits[1];
        const range = endNote - startNote + 1;
        const w = this.getNoteRowsWidth();
        for (let i = 0; i < range; i++) {
            if (i % 2 == 0) {
                context.fillStyle = "#aaaaaa";
            }
            else {
                context.fillStyle = "#cccccc";
            }
            context.fillRect(x, y + i * this.noteRowHeight, w, this.noteRowHeight);
        }
        // Paint the beat lines
        let beats = w / this.beatWidth;
        let currentX = x;
        context.beginPath();
        for (let i = 0; i < beats; i++) {
            currentX = x + i * this.beatWidth;
            context.moveTo(currentX, y);
            context.lineTo(currentX, y + range * this.noteRowHeight);
        }
        context.lineWidth = 1;
        context.strokeStyle = "#888888";
        context.stroke();
        const ches = this.harmony.getConstantHarmonyElements();
        const totalHeight = this.noteRowHeight * range;
        if (this.highlightScales || this.highlightChords) {
            currentX = x;

            for (let e of ches) {
                let beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
                const scalePitchClasses = e.getPitchClassesFromAbsoluteNotes(e.getScaleAbsoluteNotes());
                const chordPitchClasses = e.getPitchClassesFromAbsoluteNotes(e.getAbsoluteNotesFromScaleIndices(e.getChordRootPositionScaleIndices()));
                for (let j = 0; j < range; j++) {
                    const note = j + startNote;
                    const pitchClass = note % 12;
                    const highlightScale = arrayContains(scalePitchClasses, pitchClass);
                    const highlightChord = arrayContains(chordPitchClasses, pitchClass);
                    const noteY = y + totalHeight - (j + 1) * this.noteRowHeight;
                    if (highlightChord && this.highlightChords) {
                        context.fillStyle = "#ffff00";
                        context.fillRect(currentX, noteY, beats * this.beatWidth, this.noteRowHeight);
                    }
                    else if (highlightScale && this.highlightScales) {
                        context.fillStyle = "#ffffff";
                        context.fillRect(currentX, noteY, beats * this.beatWidth, this.noteRowHeight);
                    }
                }
                currentX += beats * this.beatWidth;
            }
        }
        // Paint the harmony lines
        currentX = x;
        context.beginPath();

        for (let e of ches) {
            let beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
            currentX += beats * this.beatWidth;
            context.moveTo(currentX, y);
            context.lineTo(currentX, y + range * this.noteRowHeight);
        }

        context.lineWidth = 2;
        context.strokeStyle = "#666666";
        context.stroke();
    }
    paint(offsetX, offsetY, context) {
        if (!offsetX) {
            offsetX = 0;
        }
        if (!offsetY) {
            offsetY = 0;
        }
        // Paint one harmony at a time since the time signature can change
        context.fillStyle = "#444444";
        context.fillRect(offsetX, offsetY, this.width, this.height);
        const keysY = offsetY;
        if (this.showKeys) {
            this.paintKeys(offsetX, keysY, context);
        }
        let rowsX = offsetX;
        const rowsY = keysY;
        rowsX += this.paddingLeft;
        this.paintRows(rowsX, rowsY, context);
        this.paintNotes(rowsX, rowsY, context);
    }
}



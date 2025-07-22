#!/usr/bin/env swift

import Foundation
import AppKit

// MARK: - 配置目标尺寸
let targetWidth: CGFloat = 1280
let targetHeight: CGFloat = 800
let outputDir = FileManager.default.currentDirectoryPath

// MARK: - 获取命令行参数
guard CommandLine.arguments.count >= 2 else {
    print("Usage: crop.swift input-image-path [output-image-path]")
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments.count >= 3
    ? CommandLine.arguments[2]
    : "\(outputDir)/output.png"

// MARK: - 加载图片
guard let inputImage = NSImage(contentsOfFile: inputPath),
      let cgImage = inputImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("❌ 无法读取图片")
    exit(1)
}

let sourceWidth = CGFloat(cgImage.width)
let sourceHeight = CGFloat(cgImage.height)
let targetRatio = targetWidth / targetHeight
let sourceRatio = sourceWidth / sourceHeight

// MARK: - 计算裁切区域（居中裁切）
var cropRect: CGRect
if sourceRatio > targetRatio {
    // 宽图 -> 裁左右
    let newWidth = sourceHeight * targetRatio
    let x = (sourceWidth - newWidth) / 2
    cropRect = CGRect(x: x, y: 0, width: newWidth, height: sourceHeight)
} else {
    // 高图 -> 裁上下
    let newHeight = sourceWidth / targetRatio
    let y = (sourceHeight - newHeight) / 2
    cropRect = CGRect(x: 0, y: y, width: sourceWidth, height: newHeight)
}

// MARK: - 裁切 CGImage
guard let croppedCG = cgImage.cropping(to: cropRect) else {
    print("❌ 裁切失败")
    exit(1)
}

// MARK: - 创建目标尺寸图像上下文
let outputSize = NSSize(width: targetWidth, height: targetHeight)
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil,
                              pixelsWide: Int(targetWidth),
                              pixelsHigh: Int(targetHeight),
                              bitsPerSample: 8,
                              samplesPerPixel: 4,
                              hasAlpha: true,
                              isPlanar: false,
                              colorSpaceName: .deviceRGB,
                              bytesPerRow: 0,
                              bitsPerPixel: 0)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSGraphicsContext.current?.cgContext.interpolationQuality = .high

let croppedImage = NSImage(cgImage: croppedCG, size: .zero)
croppedImage.draw(in: CGRect(origin: .zero, size: outputSize),
                  from: .zero,
                  operation: .copy,
                  fraction: 1.0)

NSGraphicsContext.restoreGraphicsState()

// MARK: - 导出为 PNG
guard let imageData = bitmap.representation(using: .png, properties: [:]) else {
    print("❌ 图片导出失败")
    exit(1)
}

do {
    try imageData.write(to: URL(fileURLWithPath: outputPath))
    print("✅ 图片已保存到：\(outputPath)")
} catch {
    print("❌ 保存失败: \(error)")
}

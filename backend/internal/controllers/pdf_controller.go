package controllers

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
)

// formatRupiah is a helper to format numbers to IDR
func formatRupiah(amount float64) string {
	s := fmt.Sprintf("%.0f", amount)
	if len(s) <= 3 {
		return "Rp " + s
	}
	var res []string
	for i := len(s); i > 0; i -= 3 {
		start := i - 3
		if start < 0 {
			start = 0
		}
		res = append([]string{s[start:i]}, res...)
	}
	return "Rp " + strings.Join(res, ".")
}

func DownloadSlipPDF(c *gin.Context) {
	userID := c.Query("user_id")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if userID == "" || startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "user_id, start_date, dan end_date wajib diisi"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format start_date salah"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format end_date salah"})
		return
	}
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// Get User
	var user models.User
	if err := database.DB.Preload("Role").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	feePercentage := user.FeePercentage / 100.0

	// Get Treatment Logs
	var logs []models.TreatmentLog
	if err := database.DB.Preload("Treatment").
		Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date ASC").
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data tindakan"})
		return
	}

	totalAllTariff := 0.0
	totalFixedTariff := 0.0
	totalMaterialDeduction := 0.0
	totalFixedMedicalFee := 0.0

	for _, log := range logs {
		totalAllTariff += log.AppliedTariff

		if log.Treatment.IsFixedFee {
			totalFixedTariff += log.AppliedTariff
			totalFixedMedicalFee += log.Treatment.FixedMedicalFee
		} else {
			if user.ApplyDeductions {
				totalMaterialDeduction += log.Treatment.MaterialDeduction
			}
		}
	}

	totalPembagian := (totalAllTariff - totalFixedTariff) - totalMaterialDeduction
	totalGaji := (totalPembagian * feePercentage) + totalFixedMedicalFee

	// Get Site Config
	var siteConfig models.SiteConfig
	database.DB.First(&siteConfig)
	appName := siteConfig.AppName
	if appName == "" {
		appName = "Klinik"
	}

	// === Generate PDF ===
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Colors
	primaryColor := []int{30, 64, 175}  // Blue 800
	borderColor := []int{226, 232, 240} // Slate 200

	// Header Rectangle (taller to accommodate logo + subtitle)
	pdf.SetFillColor(22, 163, 74) // Green 600
	pdf.Rect(0, 0, 210, 40, "F")

	// Render Logo from logo.PNG
	logoRendered := false
	logoPaths := []string{"../../logo.PNG", "logo.PNG", "../../../logo.PNG", "/app/logo.PNG", `c:\Users\User\Documents\Freelance\Go-Greys\logo.PNG`}
	var file *os.File
	for _, p := range logoPaths {
		file, err = os.Open(p)
		if err == nil {
			break
		}
	}

	if file != nil {
		fileBytes, err := io.ReadAll(file)
		file.Close()
		if err == nil {
			imgConfig, _, err := image.DecodeConfig(bytes.NewReader(fileBytes))
			if err == nil && imgConfig.Width > 0 {
				imgPath := "logo_header"
				pdf.RegisterImageOptionsReader(imgPath, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(fileBytes))
				
				// Logo di atas, subtitle di bawah → logo tinggi 22mm, mulai Y=3
				h := 22.0
				w := h * float64(imgConfig.Width) / float64(imgConfig.Height)
				if w > 100 {
					w = 100
					h = w * float64(imgConfig.Height) / float64(imgConfig.Width)
				}
				x := (210.0 - w) / 2.0
				y := (40.0-h)/2.0 - 3.0 // sedikit ke atas buat ruang subtitle
				
				pdf.ImageOptions(imgPath, x, y, w, h, false, gofpdf.ImageOptions{ImageType: "PNG"}, 0, "")

				// Subtitle di bawah logo
				pdf.SetTextColor(255, 255, 255)
				pdf.SetFont("Arial", "", 10)
				pdf.SetXY(10, y+h+1)
				pdf.CellFormat(190, 6, "SLIP GAJI PEGAWAI", "", 1, "C", false, 0, "")

				logoRendered = true
			}
		}
	} 
	
	if !logoRendered {
		// Fallback text if logo fails to load
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Arial", "B", 24)
		pdf.SetXY(10, 8)
		pdf.CellFormat(190, 10, appName, "", 1, "C", false, 0, "")
		pdf.SetFont("Arial", "", 12)
		pdf.CellFormat(190, 8, "SLIP GAJI PEGAWAI", "", 1, "C", false, 0, "")
	}

	pdf.SetTextColor(0, 0, 0)
	pdf.SetY(45) // after taller header

	// Identity Box (No Background, just text)
	pdf.SetXY(10, 45)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(25, 5, "Nama", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(70, 5, ": "+user.Name, "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(25, 5, "Periode", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(60, 5, ": "+startDate.Format("02/01/2006")+" s/d "+endDate.Format("02/01/2006"), "", 1, "L", false, 0, "")

	pdf.SetX(10)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(25, 5, "Role", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	roleStr := "-"
	if user.Role.Name != "" {
		roleStr = user.Role.Name
	}
	pdf.CellFormat(70, 5, ": "+roleStr, "", 0, "L", false, 0, "")

	pdf.Ln(10) // Smaller spacing

	// Section Title
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(190, 6, "Rincian Tindakan", "", 1, "L", false, 0, "")

	// Table Header (Modern, No gray bg, just border bottom)
	pdf.SetDrawColor(borderColor[0], borderColor[1], borderColor[2])
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(30, 6, "TANGGAL", "B", 0, "L", false, 0, "")
	pdf.CellFormat(80, 6, "NAMA TINDAKAN", "B", 0, "L", false, 0, "")
	pdf.CellFormat(40, 6, "TARIF", "B", 0, "R", false, 0, "")
	pdf.CellFormat(40, 6, "POT. BAHAN", "B", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 9)
	visibleCount := 0
	for _, log := range logs {
		if log.Treatment.HideInPDF {
			continue // Sembunyikan dari tampilan PDF, tetap ikut kalkulasi
		}
		visibleCount++
		pdf.CellFormat(30, 6, log.Date.Format("02/01/2006"), "B", 0, "L", false, 0, "")

		tindakanName := log.Treatment.Name
		if log.Notes != "" {
			tindakanName += " (" + log.Notes + ")"
		}

		pdf.CellFormat(80, 6, tindakanName, "B", 0, "L", false, 0, "")
		pdf.CellFormat(40, 6, formatRupiah(log.AppliedTariff), "B", 0, "R", false, 0, "")

		potBahan := 0.0
		if !log.Treatment.IsFixedFee && user.ApplyDeductions {
			potBahan = log.Treatment.MaterialDeduction
		}
		pdf.CellFormat(40, 6, formatRupiah(potBahan), "B", 1, "R", false, 0, "")
	}
	if visibleCount == 0 {
		pdf.CellFormat(190, 6, "Tidak ada tindakan di periode ini", "B", 1, "C", false, 0, "")
	}
	pdf.Ln(4) // Smaller spacing

	// Section Title
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(190, 6, "Rumus Perhitungan", "", 1, "L", false, 0, "")

	// Perhitungan Box
	startX := 10.0
	boxWidth := 190.0

	// Helper for summary rows
	printSummaryRow := func(label, value string, isBold bool, color []int) {
		pdf.SetX(startX)
		if isBold {
			pdf.SetFont("Arial", "B", 10)
		} else {
			pdf.SetFont("Arial", "", 9)
		}
		if color != nil {
			pdf.SetTextColor(color[0], color[1], color[2])
		} else {
			pdf.SetTextColor(0, 0, 0)
		}
		pdf.CellFormat(boxWidth-60, 6, label, "B", 0, "L", false, 0, "")
		pdf.CellFormat(60, 6, value, "B", 1, "R", false, 0, "")
	}

	red := []int{220, 38, 38}
	green := []int{5, 150, 105}

	printSummaryRow("Total Tarif Semua Tindakan", formatRupiah(totalAllTariff), false, nil)
	printSummaryRow("Tarif Tetap (Fixed Fee)", "- "+formatRupiah(totalFixedTariff), false, red)
	if user.ApplyDeductions {
		printSummaryRow("Potongan Bahan", "- "+formatRupiah(totalMaterialDeduction), false, red)
	}

	printSummaryRow("Dasar Pembagian (Persentase)", formatRupiah(totalPembagian), true, nil)
	printSummaryRow(fmt.Sprintf("Fee Medis (%v%%)", user.FeePercentage), formatRupiah(totalPembagian*feePercentage), true, green)

	if totalFixedMedicalFee > 0 {
		printSummaryRow("Tambahan Jasa Medis Tetap", "+ "+formatRupiah(totalFixedMedicalFee), true, green)
	}

	pdf.Ln(4)

	// Final Total Box (Keep the blue bar for total as it's not "gray" and looks good, but make it thinner)
	pdf.SetX(startX)
	pdf.SetFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(boxWidth-60, 10, "  TOTAL GAJI DITERIMA", "", 0, "L", true, 0, "")
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(60, 10, formatRupiah(totalGaji)+"  ", "", 1, "R", true, 0, "")

	pdf.SetTextColor(0, 0, 0)

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		fmt.Println("Error generating PDF:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghasilkan PDF", "error": err.Error()})
		return
	}

	// Render PDF ke response
	c.Header("Content-Type", "application/pdf")
	filename := fmt.Sprintf("Slip_Gaji_%s.pdf", strings.ReplaceAll(user.Name, " ", "_"))
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Writer.Write(buf.Bytes())
}

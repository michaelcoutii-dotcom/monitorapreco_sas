package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import com.mercadolivre.pricemonitor.model.Product;
import com.mercadolivre.pricemonitor.repository.PriceHistoryRepository;
import com.mercadolivre.pricemonitor.repository.ProductRepository;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ScraperService scraperService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product();
        sampleProduct.setId(1L);
        sampleProduct.setName("Produto Teste");
        sampleProduct.setUrl("https://mercadolivre.com.br/produto-123");
        sampleProduct.setCurrentPrice(99.90);
        sampleProduct.setLastPrice(null);
        sampleProduct.setUserId(1L);
        sampleProduct.setLastCheckedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Deve retornar produtos do usuário")
    void deveRetornarProdutosDoUsuario() {
        // Arrange
        Long userId = 1L;
        List<Product> expectedProducts = Arrays.asList(sampleProduct);
        when(productRepository.findByUserId(userId)).thenReturn(expectedProducts);

        // Act
        List<Product> result = productService.getProductsByUserId(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Produto Teste", result.get(0).getName());
        verify(productRepository, times(1)).findByUserId(userId);
    }

    @Test
    @DisplayName("Deve retornar produto por ID")
    void deveRetornarProdutoPorId() {
        // Arrange
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        // Act
        Optional<Product> result = productService.getProductById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Produto Teste", result.get().getName());
    }

    @Test
    @DisplayName("Deve retornar vazio quando produto não existe")
    void deveRetornarVazioQuandoProdutoNaoExiste() {
        // Arrange
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Product> result = productService.getProductById(999L);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Deve remover produto e histórico")
    void deveRemoverProdutoEHistorico() {
        // Arrange
        Long productId = 1L;
        doNothing().when(priceHistoryRepository).deleteByProductId(productId);
        doNothing().when(productRepository).deleteById(productId);

        // Act
        productService.removeProduct(productId);

        // Assert
        verify(priceHistoryRepository, times(1)).deleteByProductId(productId);
        verify(productRepository, times(1)).deleteById(productId);
    }

    @Test
    @DisplayName("Deve atualizar produto com novo preço")
    void deveAtualizarProdutoComNovoPreco() {
        // Arrange
        ScrapeResponse scrapeData = new ScrapeResponse("Produto Atualizado", 89.90, "http://img.jpg", null, null, null);
        
        // Act
        productService.updateSingleProduct(sampleProduct, scrapeData);

        // Assert
        assertEquals(99.90, sampleProduct.getLastPrice()); // Preço antigo virou lastPrice
        assertEquals(89.90, sampleProduct.getCurrentPrice()); // Novo preço
        assertEquals("Produto Atualizado", sampleProduct.getName());
        verify(productRepository, times(1)).save(sampleProduct);
        verify(priceHistoryRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Não deve atualizar produto com dados inválidos")
    void naoDeveAtualizarProdutoComDadosInvalidos() {
        // Arrange
        ScrapeResponse invalidData = new ScrapeResponse(null, null, null, null, null, null);

        // Act
        productService.updateSingleProduct(sampleProduct, invalidData);

        // Assert
        verify(productRepository, never()).save(any());
    }
}
